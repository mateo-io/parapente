import { config } from "dotenv"
import { fileURLToPath } from "node:url"
import pg from "pg"

const rootEnvironmentPath = fileURLToPath(
  new URL("../../.env", import.meta.url),
)

config({ path: rootEnvironmentPath, quiet: true })

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://pachosky@127.0.0.1:5432/parapente"

export const database = new pg.Pool({
  connectionString,
  max: 6,
  application_name: "parapente-local-api",
})
