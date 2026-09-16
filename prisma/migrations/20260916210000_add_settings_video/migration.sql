-- Homepage film block. JSON rather than a bare column so further video options
-- (poster image, caption) can be added without another migration.
ALTER TABLE "site_settings" ADD COLUMN "video" JSONB NOT NULL DEFAULT '{}';
