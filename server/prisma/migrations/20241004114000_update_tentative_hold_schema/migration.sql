-- AlterTable
ALTER TABLE "tentative_holds" RENAME COLUMN "start" TO "startsAt";
ALTER TABLE "tentative_holds" RENAME COLUMN "end" TO "endsAt";
ALTER TABLE "tentative_holds" RENAME COLUMN "key" TO "idempotencyKey";

-- CreateIndex
CREATE UNIQUE INDEX "tentative_holds_idempotencyKey_key" ON "tentative_holds"("idempotencyKey");

-- CreateIndex
CREATE INDEX "tentative_holds_eventId_provider_startsAt_idx" ON "tentative_holds"("eventId", "provider", "startsAt");
