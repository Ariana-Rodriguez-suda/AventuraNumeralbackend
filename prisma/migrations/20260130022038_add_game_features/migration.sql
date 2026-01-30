-- AlterTable
ALTER TABLE "level_attempts" ADD COLUMN     "coins_collected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stars_earned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "success" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "avatar" TEXT DEFAULT 'avatargirl1',
ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "current_item" INTEGER,
ADD COLUMN     "lives" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "stars" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "effect_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_items" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "purchased_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_name_key" ON "items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "student_items_student_id_item_id_key" ON "student_items"("student_id", "item_id");

-- AddForeignKey
ALTER TABLE "student_items" ADD CONSTRAINT "student_items_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_items" ADD CONSTRAINT "student_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
