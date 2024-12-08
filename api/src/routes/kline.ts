import { Client } from "pg";
import { Router, Request, Response } from "express";

const pgClient = new Client({
  user: "onkar",
  host: "localhost",
  database: "exchange",
  password: "onkar123",
  port: 5432,
});
pgClient.connect();

export const klineRouter = Router();

interface KlineQuery {
  market?: string;
  interval?: "1m" | "1h" | "1w";
  startTime?: string;
  endTime?: string;
}

klineRouter.get("/", async (req: any, res: any) => {
  const { interval, startTime, endTime } = req.query;

  let query;
  switch (interval) {
    case "1m":
      query = `SELECT * FROM klines_1m`;
      break;
    case "1h":
      query = `SELECT * FROM klines_1h`;
      break;
    case "1w":
      query = `SELECT * FROM klines_1w`;
      break;
    default:
      return res.status(400).send("Invalid interval");
  }

  try {
    const startTimestamp = Number(startTime) * 1000;
    const endTimestamp = Number(endTime) * 1000;

    const result = await pgClient.query(query);

    res.json(
      result.rows.map((x) => ({
        close: x.close,
        end: x.bucket,
        high: x.high,
        low: x.low,
        open: x.open,
        quoteVolume: x.quoteVolume,
        start: x.start,
        trades: x.trades,
        volume: x.volume,
      }))
    );
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
