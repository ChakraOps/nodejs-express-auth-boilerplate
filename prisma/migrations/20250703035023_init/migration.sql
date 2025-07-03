-- CreateIndex
CREATE INDEX "users_email_deletedAt_idx" ON "users"("email", "deletedAt");

-- RenameIndex
ALTER INDEX "users_email_key" RENAME TO "unique_active_email";
