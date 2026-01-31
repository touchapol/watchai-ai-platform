#!/bin/sh
set -e

echo "Syncing database schema..."
node node_modules/prisma/build/index.js db push --skip-generate 2>/dev/null || echo "Database schema already in sync"

echo "Starting application..."
exec node server.js
