#!/bin/bash
# Seed demo data into MemexFlow
# Usage: ./scripts/seed-demo.sh [USER_ID]
#
# If USER_ID is not provided, the script will look it up from auth.users
# Requires: psql, supabase CLI

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SEED_FILE="supabase/seed.sql"

if [ -z "$1" ]; then
  echo -e "${YELLOW}No user ID provided. Looking up demo user...${NC}"
  USER_ID=$(psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -t -c "SELECT id FROM auth.users LIMIT 1;" 2>/dev/null | tr -d ' ' | head -1)

  if [ -z "$USER_ID" ]; then
    echo -e "${YELLOW}No user found. Please sign up first, then run:${NC}"
    echo "  ./scripts/seed-demo.sh YOUR_USER_ID"
    echo ""
    echo -e "${YELLOW}Or find your user ID with:${NC}"
    echo "  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c \"SELECT id, email FROM auth.users;\""
    exit 1
  fi
else
  USER_ID="$1"
fi

echo -e "${GREEN}Seeding demo data for user: $USER_ID${NC}"

# Replace DEMO_USER_ID placeholder in seed.sql and execute
SEED_SQL=$(sed "s/DEMO_USER_ID/$USER_ID/g" "$SEED_FILE")

echo "$SEED_SQL" | psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo -e "${GREEN}✓ Demo data seeded successfully!${NC}"
echo ""
echo "Created:"
echo "  - 3 topics (RAG, AI Agents, Productivity)"
echo "  - 10 captures (9 confirmed, 1 pending)"
echo "  - 9 memories"
echo "  - 3 briefs (1 completed, 1 processing, 1 pending)"
echo "  - 4 brief-memory citations"
echo "  - 4 memory associations"
echo "  - 3 signal rules"
echo "  - 2 signal matches"
echo "  - 3 recall suggestions"
echo "  - 5 jobs"