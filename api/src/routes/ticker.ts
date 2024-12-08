import { Router } from "express";
import { Client } from "pg";

const client = new Client({
  user: "onkar",
  host: "localhost",
  database: "exchange",
  password: "onkar123",
  port: 5432,
});

client.connect();

export const tickersRouter = Router();

tickersRouter.get("/", async (req, res) => {
  try {
    const { market } = req.query;
    const query = `
      SELECT price, volume, time
      FROM tata_prices
      WHERE currency_code = $1
        AND time >= NOW() - INTERVAL '24 hours'
      ORDER BY time DESC;
    `;
    const values = [market || "INR"];

    const result = await client.query(query, values);

    if (result.rows.length > 0) {
      const prices = result.rows.map((row) => parseFloat(row.price));
      const volumes = result.rows.map((row) => parseFloat(row.volume));
      const lastTradedPrice = prices[0];

      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const totalVolume = volumes.reduce((acc, val) => acc + val, 0);

      res.json({
        latestTradePrice: lastTradedPrice,
        high: high,
        low: low,
        volume: totalVolume,
      });
    } else {
      res.status(404).json({ message: "No data found for the last 24 hours" });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
