-- Atomic allocation of enquiry reference numbers.
--
-- The first implementation read the highest existing reference and added one.
-- Under concurrent submissions every writer reads the same value, computes the
-- same next one, and all but one hit the unique index — a burst of ten
-- simultaneous submissions reliably lost one, which for this form means a lost
-- customer. Retrying does not fix the shape: each retry re-reads the same
-- number.
--
-- One row per period, incremented in a single statement instead. UPDATE takes a
-- row lock, so concurrent callers queue and each receives a distinct value.

CREATE TABLE "enquiry_reference_counters" (
    -- 'YYMM', matching the reference format ENQ-YYMM-NNNN.
    "period" VARCHAR(4) NOT NULL,
    "last_seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "enquiry_reference_counters_pkey" PRIMARY KEY ("period")
);

-- Seed from the references that already exist, so the counter never reissues a
-- number that the backfill in the previous migration handed out.
INSERT INTO "enquiry_reference_counters" ("period", "last_seq")
SELECT substring("reference" from 5 for 4) AS period,
       max(substring("reference" from 10 for 4)::int) AS last_seq
  FROM "enquiries"
 WHERE "reference" IS NOT NULL
 GROUP BY 1;
