import { config } from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "../src/client";

config({ path: "../../.env" });

const db = createDb();
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("✔ migrações aplicadas");
process.exit(0);
