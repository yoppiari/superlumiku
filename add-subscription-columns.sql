-- Add subscription system columns to users table
-- Run this in production database

-- Add accountType and subscriptionTier columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "accountType" TEXT DEFAULT 'payg',
ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'free';

-- Verify columns added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('accountType', 'subscriptionTier');

-- Show all users
SELECT id, email, name, "accountType", "subscriptionTier" FROM users LIMIT 10;
