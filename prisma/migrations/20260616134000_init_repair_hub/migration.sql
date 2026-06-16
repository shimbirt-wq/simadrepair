-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'LECTURER', 'TECHNICIAN', 'ADMIN');

-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('REGISTRATION_COMPLETED', 'DEVICE_RECEIVED', 'DIAGNOSIS_IN_PROGRESS', 'REPAIR_IN_PROGRESS', 'QUALITY_INSPECTION', 'READY_FOR_COLLECTION', 'DEVICE_COLLECTED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('DASHBOARD', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "university_id" TEXT,
    "faculty" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_tickets" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "technician_id" TEXT,
    "issue_description" TEXT NOT NULL,
    "photo_url" TEXT,
    "status" "RepairStatus" NOT NULL DEFAULT 'REGISTRATION_COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_logs" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "technician_id" TEXT,
    "status" "RepairStatus" NOT NULL,
    "diagnosis" TEXT,
    "repair_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_activity" (
    "id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "check_in" TIMESTAMP(3) NOT NULL,
    "check_out" TIMESTAMP(3),
    "repairs_completed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technician_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'DASHBOARD',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_university_id_key" ON "users"("university_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_faculty_idx" ON "users"("faculty");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "devices_owner_id_idx" ON "devices"("owner_id");

-- CreateIndex
CREATE INDEX "devices_serial_number_idx" ON "devices"("serial_number");

-- CreateIndex
CREATE INDEX "devices_device_type_idx" ON "devices"("device_type");

-- CreateIndex
CREATE INDEX "devices_created_at_idx" ON "devices"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "repair_tickets_ticket_id_key" ON "repair_tickets"("ticket_id");

-- CreateIndex
CREATE INDEX "repair_tickets_device_id_idx" ON "repair_tickets"("device_id");

-- CreateIndex
CREATE INDEX "repair_tickets_technician_id_idx" ON "repair_tickets"("technician_id");

-- CreateIndex
CREATE INDEX "repair_tickets_status_idx" ON "repair_tickets"("status");

-- CreateIndex
CREATE INDEX "repair_tickets_status_created_at_idx" ON "repair_tickets"("status", "created_at");

-- CreateIndex
CREATE INDEX "repair_tickets_created_at_idx" ON "repair_tickets"("created_at");

-- CreateIndex
CREATE INDEX "repair_logs_ticket_id_idx" ON "repair_logs"("ticket_id");

-- CreateIndex
CREATE INDEX "repair_logs_technician_id_idx" ON "repair_logs"("technician_id");

-- CreateIndex
CREATE INDEX "repair_logs_created_at_idx" ON "repair_logs"("created_at");

-- CreateIndex
CREATE INDEX "technician_activity_technician_id_idx" ON "technician_activity"("technician_id");

-- CreateIndex
CREATE INDEX "technician_activity_check_in_idx" ON "technician_activity"("check_in");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_ticket_id_idx" ON "notifications"("ticket_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_idx" ON "notifications"("user_id", "status");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_tickets" ADD CONSTRAINT "repair_tickets_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_tickets" ADD CONSTRAINT "repair_tickets_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_logs" ADD CONSTRAINT "repair_logs_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "repair_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_logs" ADD CONSTRAINT "repair_logs_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_activity" ADD CONSTRAINT "technician_activity_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "repair_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
