#!/bin/bash
export NODE_ENV=development
export PORT=5000
export DATABASE_URL="postgresql://neondb_owner:npg_yDvGbR70iEsk@ep-late-forest-aczmiwpt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
export SESSION_SECRET="dev-secret-key"
export KIWIFY_WEBHOOK_SECRET="zmf4nrsem5h"

npx tsx server/index.ts
