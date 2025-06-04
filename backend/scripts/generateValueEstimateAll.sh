#!/usr/bin/env bash
#
# generateValueEstimateAll.sh
#
# Generate SQL to populate conservative price estimates for all symbols in user_investments.
# Requires DB credentials in backend/.env or via environment variables: DB_HOST, DB_USER,
# DB_PASSWORD, DB_NAME.
#
set -euo pipefail

# Number of years for estimates (default: 10)
YEARS="${1:-10}"

# Base directory (backend root)
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BASE_DIR"

# Load environment variables from .env if present
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

OUTPUT="scripts/valueEstimate_all.sql"
: > "$OUTPUT"

echo "Generating value estimates for ${YEARS} years for all user investment symbols..."

mysql -u"$DB_USER" -p"$DB_PASSWORD" -h"${DB_HOST:-localhost}" -P"${DB_PORT:-3306}" -N -B \
  -e "SELECT DISTINCT symbol, type, DATE_FORMAT(invested_at,'%Y-%m-%d') AS date FROM user_investments;" "$DB_NAME" \
| while read -r SYMBOL TYPE DATE; do
  echo "Processing ${SYMBOL} (${TYPE}) purchased on ${DATE}..."
  PRICE=$(node "scripts/yieldCalc.js" --price-only "$SYMBOL" "$DATE" \
    | awk -F '$' '/closing price on/ {print $2}')
  echo "  Price: $PRICE"
  node "scripts/valueEstimate.js" --ticker="$SYMBOL" --type="$TYPE" --price="$PRICE" --years="$YEARS"
  cat "scripts/valueEstimate.sql" >> "$OUTPUT"
done

echo "Bulk value estimates SQL written to ${OUTPUT}"
echo "Apply it using: mysql -u\$DB_USER -p\$DB_PASSWORD \$DB_NAME < ${OUTPUT}"