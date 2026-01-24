import dotenv from "dotenv";

dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post("/save-level-time", async (req, res) => {
  const { playerName, levelName, timeElapsed, checkpointTime, reachedCheckpoint } = req.body;

  try {
    const record = await prisma.level_times.create({
      data: {
        player_name: playerName,
        level_name: levelName,
        time_elapsed: timeElapsed,
        checkpoint_time: checkpointTime,
        reached_checkpoint: reachedCheckpoint,
      },
    });
    res.json({ success: true, record });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
      res.status(500).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: "Unknown error" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
