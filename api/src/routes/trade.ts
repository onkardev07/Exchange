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

export const tradesRouter = Router();

tradesRouter.get("/", async (req, res) => {
  try {
    const { market } = req.query;
    const query = `
      SELECT * 
      FROM tata_prices 
      WHERE currency_code = $1
      ORDER BY time DESC
      LIMIT 10;
    `;
    const values = [market || "INR"];

    const result = await client.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
