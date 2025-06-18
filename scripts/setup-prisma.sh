#!/bin/bash

# Vercel build script for Prisma
echo "Starting Prisma setup..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Show generated files
echo "Checking generated files..."
ls -la node_modules/.prisma/client/

echo "Prisma setup complete!"
