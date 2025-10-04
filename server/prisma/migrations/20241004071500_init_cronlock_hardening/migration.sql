-- CreateTable
CREATE TABLE "cron_locks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobName" TEXT NOT NULL,
    "lockedBy" TEXT NOT NULL,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "metadata" TEXT
);

-- CreateIndex
CREATE INDEX "cron_locks_jobName_expiresAt_idx" ON "cron_locks"("jobName", "expiresAt");

-- CreateIndex
CREATE INDEX "cron_locks_expiresAt_idx" ON "cron_locks"("expiresAt");
