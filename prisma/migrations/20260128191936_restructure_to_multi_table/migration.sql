/*
  Warnings:

  - You are about to drop the `level_times` table. If the table is not empty, all the data it contains will be lost.

*/

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "class_name" TEXT NOT NULL,
    "access_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "student_name" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_attempts" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "level_name" TEXT NOT NULL,
    "time_elapsed" REAL NOT NULL,
    "checkpoint_time" REAL,
    "reached_checkpoint" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "level_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_class_id_student_name_key" ON "students"("class_id", "student_name");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_attempts" ADD CONSTRAINT "level_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- DATA MIGRATION: Migrate existing data from level_times to new structure
-- =============================================================================

-- Step 1: Create teacher with your school email
INSERT INTO "teachers" (email, name, created_at)
VALUES ('amrodriguez@sudamericano.edu.ec', 'Ariana Rodriguez', CURRENT_TIMESTAMP);

-- Step 2: Create a default class linked to the teacher
INSERT INTO "classes" (teacher_id, class_name, access_code, created_at)
VALUES (
    (SELECT id FROM "teachers" WHERE email = 'amrodriguez@sudamericano.edu.ec'),
    'Sexto Basica A',
    'CLASS2026',
    CURRENT_TIMESTAMP
);

-- Step 3: Migrate unique students from level_times to students table
INSERT INTO "students" (class_id, student_name, created_at)
SELECT 
    (SELECT id FROM "classes" WHERE class_name = 'Sexto Basica A'),
    player_name,
    MIN(created_at)
FROM "level_times"
WHERE player_name IS NOT NULL
GROUP BY player_name;

-- Step 4: Migrate all attempts from level_times to level_attempts
INSERT INTO "level_attempts" (student_id, level_name, time_elapsed, checkpoint_time, reached_checkpoint, created_at)
SELECT 
    s.id,
    COALESCE(lt.level_name, 'level-1'),
    COALESCE(lt.time_elapsed, 0),
    lt.checkpoint_time,
    COALESCE(lt.reached_checkpoint, false),
    COALESCE(lt.created_at, CURRENT_TIMESTAMP)
FROM "level_times" lt
INNER JOIN "students" s ON s.student_name = lt.player_name
WHERE lt.player_name IS NOT NULL;

-- Step 5: Drop the old table now that data is migrated
DROP TABLE "level_times";
