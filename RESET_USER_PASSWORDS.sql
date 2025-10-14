-- ============================================
-- LUMIKU APP - USER PASSWORD RESET
-- Date: 2025-10-13
-- Reason: P0 Security Issue - Passwords exposed in git history
-- ============================================

-- IMPORTANT: Run this SQL script on your production database
-- This will reset passwords for 4 compromised enterprise users

BEGIN;

-- Update password for ardianfaisal.id@gmail.com
UPDATE "User"
SET
  password = '$2b$10$lR5b6dpsCPOM2wxJISxzhOYptn/Vd86ZV8rmq.s8zR4Q76guW8VY.',
  "updatedAt" = NOW()
WHERE email = 'ardianfaisal.id@gmail.com';

-- Update password for iqbal.elvo@gmail.com
UPDATE "User"
SET
  password = '$2b$10$lFeKfEAnTAIA2cx2UJR5SecodJeYrtx2G090GfjmZmZAI9Hm5DsSa',
  "updatedAt" = NOW()
WHERE email = 'iqbal.elvo@gmail.com';

-- Update password for galuh.inteko@gmail.com
UPDATE "User"
SET
  password = '$2b$10$X/ba9LyA1OFUkCGI.xt/2uU.gQr2yrNjXH.SVZprIzAlJDZ6QJBIq',
  "updatedAt" = NOW()
WHERE email = 'galuh.inteko@gmail.com';

-- Update password for dilla.inteko@gmail.com
UPDATE "User"
SET
  password = '$2b$10$zQDEFIgkgz39cfSsXwA7beWek6LDWwRj5M3Sg88SBAfQQbb8uGDAK',
  "updatedAt" = NOW()
WHERE email = 'dilla.inteko@gmail.com';

-- Verify updates
SELECT
  id,
  email,
  name,
  role,
  "updatedAt"
FROM "User"
WHERE email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
)
ORDER BY email;

COMMIT;

-- ============================================
-- POST-EXECUTION CHECKLIST
-- ============================================
-- [ ] SQL executed successfully
-- [ ] 4 rows updated (verify count)
-- [ ] Users notified with new passwords
-- [ ] Old passwords revoked
-- [ ] Force password change on next login (optional)
