-- CreateTable
CREATE TABLE "level_times" (
    "id" SERIAL NOT NULL,
    "player_name" TEXT,
    "level_name" TEXT,
    "time_elapsed" REAL,
    "checkpoint_time" REAL,
    "reached_checkpoint" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "level_times_pkey" PRIMARY KEY ("id")
);
