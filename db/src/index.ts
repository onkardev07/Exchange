import { Client } from "pg";
import { createClient } from "redis";
import { DbMessage } from "./types";

const pgClient = new Client({
  user: "onkar",
  host: "localhost",
  database: "exchange",
  password: "onkar123",
  port: 5432,
});

pgClient.connect();

async function main() {
  const redisClient = createClient();
  await redisClient.connect();
  console.log("Connected to Redis");

  while (true) {
    const response = await redisClient.rPop("db_processor");
    if (response) {
      const data: DbMessage = JSON.parse(response);

      if (data.type === "TRADE_ADDED") {
        const price = data.data.price;
        const timestamp = data.data.timestamp;

        const volume = data.data.quantity;
        const currency_code = "INR";

        const query =
          "INSERT INTO tata_prices (time, price, volume, currency_code) VALUES ($1, $2, $3, $4)";
        const values = [timestamp, price, volume, currency_code];

        await pgClient.query(query, values);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

main().catch(console.error);
