const { Client } = require("pg");

const client = new Client({
  user: "onkar",
  host: "localhost",
  database: "exchange",
  password: "onkar123",
  port: 5432,
});

async function initializeDB() {
  await client.connect();

  try {
    await client.query(`DROP MATERIALIZED VIEW IF EXISTS klines_1m`);
    await client.query(`DROP MATERIALIZED VIEW IF EXISTS klines_1h`);
    await client.query(`DROP MATERIALIZED VIEW IF EXISTS klines_1w`);

    await client.query(`
      DROP TABLE IF EXISTS "tata_prices";
      CREATE TABLE "tata_prices"(
          time TIMESTAMP NOT NULL,
          price DOUBLE PRECISION,
          volume DOUBLE PRECISION,
          currency_code VARCHAR(10)
      );
    `);

    await client.query(`SELECT create_hypertable('tata_prices', 'time');`);

    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
      SELECT
          time_bucket('1 minute', time) AS bucket,
          first(price, time) AS open,
          max(price) AS high,
          min(price) AS low,
          last(price, time) AS close,
          sum(volume) AS volume,
          currency_code,
          sum(volume * price) AS quoteVolume,
          first(time, time) AS start,
          count(*) AS trades
      FROM tata_prices
      GROUP BY bucket, currency_code;
    `);

    const result = await client.query(`SELECT * FROM klines_1m`);
    console.log("Data in klines_1m materialized view:", result.rows);
  } catch (error) {
    console.error("Error during database initialization:", error);
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

initializeDB().catch(console.error);
