/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `devices` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "devices_userId_name_key" ON "devices"("userId", "name");
