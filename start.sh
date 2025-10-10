#!/bin/bash

echo "🚀 Starting deployment process..."

echo "📦 Generating Prisma client..."
npx prisma generate

echo "🔄 Syncing database schema..."
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ Database sync successful!"
    echo "🚀 Starting application..."
    npm run start:prod
else
    echo "❌ Database sync failed, but starting application anyway..."
    npm run start:prod
fi
