-- CreateEnum
CREATE TYPE "Status" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "Country" AS ENUM ('Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Zanzibar');

-- CreateEnum
CREATE TYPE "TourCategory" AS ENUM ('SafariExpedition', 'WeekendEscape');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'moderate', 'challenging');

-- CreateEnum
CREATE TYPE "FaqGroup" AS ENUM ('general', 'booking', 'travel', 'payment');

-- CreateEnum
CREATE TYPE "EnquiryType" AS ENUM ('contact', 'booking');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('new', 'read', 'responded', 'archived');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'editor');

-- CreateTable
CREATE TABLE "tours" (
    "id" UUID NOT NULL,
    "title" VARCHAR(140) NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "priceFrom" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'KES',
    "durationDays" INTEGER NOT NULL,
    "durationNights" INTEGER NOT NULL,
    "groupSizeMax" INTEGER NOT NULL DEFAULT 12,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'moderate',
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 4.8,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "destination_id" UUID,
    "countries" "Country"[],
    "highlights" TEXT[],
    "inclusions" TEXT[],
    "exclusions" TEXT[],
    "itinerary" JSONB NOT NULL DEFAULT '[]',
    "heroImage" JSONB NOT NULL,
    "gallery" JSONB NOT NULL DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "bestSelling" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "category" "TourCategory" NOT NULL,
    "seo" JSONB,
    "parks" TEXT[],
    "gameDriveCount" INTEGER,
    "conservancyFeesIncluded" BOOLEAN,
    "departsFrom" TEXT,
    "weekendDates" DATE[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" TEXT NOT NULL,
    "country" "Country" NOT NULL,
    "tagline" VARCHAR(180),
    "category_label" TEXT NOT NULL DEFAULT 'Destination',
    "overview" TEXT NOT NULL,
    "hero_image" JSONB NOT NULL,
    "card_image" JSONB NOT NULL,
    "highlights" TEXT[],
    "best_time" JSONB,
    "parks" JSONB NOT NULL DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "seo" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" VARCHAR(300) NOT NULL,
    "content" TEXT NOT NULL,
    "cover_image" JSONB NOT NULL,
    "author" JSONB NOT NULL DEFAULT '{"name":"Lekker Tours"}',
    "tags" TEXT[],
    "reading_minutes" INTEGER NOT NULL DEFAULT 4,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'draft',
    "seo" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" UUID NOT NULL,
    "author_name" VARCHAR(120) NOT NULL,
    "author_location" VARCHAR(120),
    "avatar" JSONB,
    "quote" VARCHAR(600) NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "tour_name" TEXT,
    "travelled_on" DATE,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" UUID NOT NULL,
    "question" VARCHAR(240) NOT NULL,
    "answer" TEXT NOT NULL,
    "group" "FaqGroup" NOT NULL DEFAULT 'general',
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "Status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" UUID NOT NULL,
    "type" "EnquiryType" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" TEXT NOT NULL,
    "phone" VARCHAR(40),
    "expedition_interest" TEXT,
    "budget_usd" DECIMAL(12,2),
    "message" TEXT,
    "tour_id" UUID,
    "tour_title" TEXT,
    "travel_date" DATE,
    "guests" JSONB,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'new',
    "admin_notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'primary',
    "hero" JSONB NOT NULL,
    "values" JSONB NOT NULL DEFAULT '[]',
    "contact" JSONB NOT NULL,
    "socials" JSONB NOT NULL DEFAULT '{}',
    "newsletter" JSONB NOT NULL,
    "footer_blurb" TEXT NOT NULL,
    "seo" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Administrator',
    "role" "AdminRole" NOT NULL DEFAULT 'admin',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tours_slug_key" ON "tours"("slug");

-- CreateIndex
CREATE INDEX "tours_status_featured_order_idx" ON "tours"("status", "featured", "order");

-- CreateIndex
CREATE INDEX "tours_category_status_idx" ON "tours"("category", "status");

-- CreateIndex
CREATE INDEX "tours_destination_id_idx" ON "tours"("destination_id");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- CreateIndex
CREATE INDEX "destinations_country_status_order_idx" ON "destinations"("country", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_published_at_idx" ON "blog_posts"("status", "published_at");

-- CreateIndex
CREATE INDEX "blog_posts_tags_idx" ON "blog_posts" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "testimonials_status_featured_order_idx" ON "testimonials"("status", "featured", "order");

-- CreateIndex
CREATE UNIQUE INDEX "faqs_question_key" ON "faqs"("question");

-- CreateIndex
CREATE INDEX "faqs_status_group_order_idx" ON "faqs"("status", "group", "order");

-- CreateIndex
CREATE INDEX "enquiries_status_created_at_idx" ON "enquiries"("status", "created_at");

-- CreateIndex
CREATE INDEX "enquiries_type_created_at_idx" ON "enquiries"("type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE SET NULL ON UPDATE CASCADE;
