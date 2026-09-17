-- Turns enquiries from a mailbox (new/read/responded/archived) into a pipeline
-- with an owner, a reference number and an append-only history.
--
-- The status column is rewritten rather than extended: "read" was set simply by
-- opening the record, so it never meant anyone had acted. Existing rows are
-- mapped onto the closest pipeline stage below.

-- ---------------------------------------------------------------------------
-- Status enum: swap in place, mapping the old values across.
-- ---------------------------------------------------------------------------

CREATE TYPE "EnquiryStatus_new" AS ENUM ('new', 'assigned', 'in_progress', 'quoted', 'won', 'lost');

-- The default references the old type, so it has to come off before the cast.
ALTER TABLE "enquiries" ALTER COLUMN "status" DROP DEFAULT;

--   new       -> new          nobody has touched it
--   read      -> in_progress  somebody opened it; treat that as work started
--   responded -> quoted       a reply went out, which here means a quote
--   archived  -> lost         terminal, and not recorded as a win
ALTER TABLE "enquiries"
    ALTER COLUMN "status" TYPE "EnquiryStatus_new"
    USING (
        CASE "status"::text
            WHEN 'new'       THEN 'new'
            WHEN 'read'      THEN 'in_progress'
            WHEN 'responded' THEN 'quoted'
            WHEN 'archived'  THEN 'lost'
            ELSE 'new'
        END
    )::"EnquiryStatus_new";

ALTER TYPE "EnquiryStatus" RENAME TO "EnquiryStatus_old";
ALTER TYPE "EnquiryStatus_new" RENAME TO "EnquiryStatus";
DROP TYPE "EnquiryStatus_old";

ALTER TABLE "enquiries" ALTER COLUMN "status" SET DEFAULT 'new';

-- ---------------------------------------------------------------------------
-- New columns.
-- ---------------------------------------------------------------------------

ALTER TABLE "enquiries" ADD COLUMN "reference"          VARCHAR(20);
ALTER TABLE "enquiries" ADD COLUMN "assignee_id"        UUID;
ALTER TABLE "enquiries" ADD COLUMN "assigned_at"        TIMESTAMP(3);
ALTER TABLE "enquiries" ADD COLUMN "last_contacted_at"  TIMESTAMP(3);
ALTER TABLE "enquiries" ADD COLUMN "follow_up_at"       TIMESTAMP(3);
ALTER TABLE "enquiries" ADD COLUMN "closed_at"          TIMESTAMP(3);

-- Rows that landed in a terminal state during the mapping above have no record
-- of when that happened; their last update is the closest honest answer.
UPDATE "enquiries" SET "closed_at" = "updated_at" WHERE "status" IN ('won', 'lost');

-- Backfill references in creation order so the sequence numbers read sensibly:
-- ENQ-YYMM-NNNN, counting per calendar month, matching newReference() in
-- src/utils/reference.js.
WITH numbered AS (
    SELECT "id",
           to_char("created_at", 'YYMM') AS period,
           row_number() OVER (
               PARTITION BY to_char("created_at", 'YYMM')
               ORDER BY "created_at", "id"
           ) AS seq
      FROM "enquiries"
)
UPDATE "enquiries" e
   SET "reference" = 'ENQ-' || n.period || '-' || lpad(n.seq::text, 4, '0')
  FROM numbered n
 WHERE e."id" = n."id";

CREATE UNIQUE INDEX "enquiries_reference_key" ON "enquiries"("reference");
CREATE INDEX "enquiries_assignee_id_status_idx" ON "enquiries"("assignee_id", "status");
CREATE INDEX "enquiries_follow_up_at_idx" ON "enquiries"("follow_up_at");

-- SetNull: removing a staff account returns their enquiries to the unassigned
-- pool rather than deleting customer records.
ALTER TABLE "enquiries"
    ADD CONSTRAINT "enquiries_assignee_id_fkey"
    FOREIGN KEY ("assignee_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Activity log.
-- ---------------------------------------------------------------------------

CREATE TYPE "EnquiryEventType" AS ENUM ('created', 'status_change', 'assigned', 'unassigned', 'note', 'contacted');

CREATE TABLE "enquiry_events" (
    "id" UUID NOT NULL,
    "enquiry_id" UUID NOT NULL,
    "type" "EnquiryEventType" NOT NULL,
    "actor_id" UUID,
    "actor_name" TEXT,
    "summary" VARCHAR(300) NOT NULL,
    "note" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "enquiry_events_enquiry_id_created_at_idx" ON "enquiry_events"("enquiry_id", "created_at");

-- Cascade: the history of a deleted enquiry has nothing left to describe.
ALTER TABLE "enquiry_events"
    ADD CONSTRAINT "enquiry_events_enquiry_id_fkey"
    FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "enquiry_events"
    ADD CONSTRAINT "enquiry_events_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Give every existing enquiry an opening entry, so a timeline that starts
-- mid-story is never shown as though nothing happened before.
INSERT INTO "enquiry_events" ("id", "enquiry_id", "type", "summary", "meta", "created_at")
SELECT gen_random_uuid(),
       "id",
       'created',
       'Enquiry received',
       jsonb_build_object('backfilled', true),
       "created_at"
  FROM "enquiries";

-- Existing admin notes were a single overwritable field. Preserve what is there
-- as the first note in the new history; the column itself stays for now.
INSERT INTO "enquiry_events" ("id", "enquiry_id", "type", "summary", "note", "meta", "created_at")
SELECT gen_random_uuid(),
       "id",
       'note',
       'Note (migrated from admin notes)',
       "admin_notes",
       jsonb_build_object('backfilled', true),
       "updated_at"
  FROM "enquiries"
 WHERE "admin_notes" IS NOT NULL AND btrim("admin_notes") <> '';
