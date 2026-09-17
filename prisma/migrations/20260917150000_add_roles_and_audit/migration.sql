-- Custom roles, a permission list per role, and an audit trail for access
-- changes. The coarse "role" enum on admin_users is deliberately left in place:
-- routes that still call requireRole() read it, and the user controller keeps
-- it in step with the assigned role.

CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "description" VARCHAR(300) NOT NULL DEFAULT '',
    "permissions" TEXT[],
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Nullable: existing accounts are backfilled by `npm run seed:roles`, which
-- maps the old enum onto Administrator/Editor.
ALTER TABLE "admin_users" ADD COLUMN "role_id" UUID;

CREATE INDEX "admin_users_role_id_idx" ON "admin_users"("role_id");

-- SetNull, not Cascade: deleting a role must never delete the people in it.
ALTER TABLE "admin_users"
    ADD CONSTRAINT "admin_users_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_email" TEXT NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "target_type" VARCHAR(40),
    "target_id" UUID,
    "target_label" TEXT,
    "changes" JSONB NOT NULL DEFAULT '{}',
    "ip" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- SetNull so deleting an account preserves the record of what it did;
-- actor_email keeps the identity legible afterwards.
ALTER TABLE "audit_log"
    ADD CONSTRAINT "audit_log_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
