-- CreateIndex
CREATE INDEX "body_area_entries_checkinId_idx" ON "body_area_entries"("checkinId");

-- CreateIndex
CREATE INDEX "body_area_entries_bodyPart_idx" ON "body_area_entries"("bodyPart");

-- CreateIndex
CREATE INDEX "daily_checkins_userId_date_idx" ON "daily_checkins"("userId", "date");

-- CreateIndex
CREATE INDEX "programs_organizationId_idx" ON "programs"("organizationId");

-- CreateIndex
CREATE INDEX "worker_programs_userId_status_idx" ON "worker_programs"("userId", "status");
