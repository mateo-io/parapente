#!/usr/bin/env bash
set -euo pipefail

task_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
db_name="${PARAPENTE_DB_NAME:-parapente}"
db_user="${PARAPENTE_DB_USER:-${USER:-pachosky}}"
db_host="${PARAPENTE_DB_HOST:-127.0.0.1}"
db_port="${PARAPENTE_DB_PORT:-5432}"
admin_db="${PARAPENTE_ADMIN_DB:-postgres}"

if [[ ! "$db_name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "PARAPENTE_DB_NAME must be a simple PostgreSQL identifier."
  exit 1
fi

if ! pg_isready -h "$db_host" -p "$db_port" -q; then
  echo "PostgreSQL is not accepting connections at ${db_host}:${db_port}."
  echo "Start the local PostgreSQL service and run this script again."
  exit 1
fi

database_exists="$(
  psql \
    -h "$db_host" \
    -p "$db_port" \
    -U "$db_user" \
    -d "$admin_db" \
    -Atqc "SELECT 1 FROM pg_database WHERE datname = '$db_name'"
)"

if [[ "$database_exists" != "1" ]]; then
  createdb -h "$db_host" -p "$db_port" -U "$db_user" "$db_name"
  echo "Created database ${db_name}."
else
  echo "Database ${db_name} already exists."
fi

database_url="postgresql://${db_user}@${db_host}:${db_port}/${db_name}"

for migration in "$task_root"/db/migrations/*.sql; do
  echo "Applying $(basename "$migration")"
  psql "$database_url" -v ON_ERROR_STOP=1 -f "$migration"
done

if [[ "${PARAPENTE_SKIP_IMPORTS:-0}" != "1" ]]; then
  if [[ ! -d "$task_root/web/node_modules/pg" ]]; then
    echo "Web dependencies are missing. Run npm install in web/ before importing site data."
    exit 1
  fi

  # Order matters. Sites must exist before elevations can be filled, elevations
  # before lifts can compute walk ascent, and both before stations are linked.
  # Running only the OpenStreetMap import leaves the app without elevations, so
  # glide reachability, the lift panel and the station readout are all dead.
  DATABASE_URL="$database_url" npm --prefix "$task_root/web" run db:import:all
fi

echo "Parapente database is ready at ${database_url}."
