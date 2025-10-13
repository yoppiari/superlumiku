-- Update passwords for 4 enterprise users
-- Password sederhana dan berbeda untuk setiap user

-- User 1: ardianfaisal.id@gmail.com
-- New password: Ardian2025
UPDATE "User"
SET password = '$2b$10$xfU.uRvnun0Z0hp/oHX6rOqDp3y.sXPQgr24uPNpvLaAmFUNSHL/6'
WHERE email = 'ardianfaisal.id@gmail.com';

-- User 2: iqbal.elvo@gmail.com
-- New password: Iqbal2025
UPDATE "User"
SET password = '$2b$10$W/g9HFPYRljaJDtgInEBeu.Xs5XYDlGVef78SMtWLm7Caj1KRFwjW'
WHERE email = 'iqbal.elvo@gmail.com';

-- User 3: galuh.inteko@gmail.com
-- New password: Galuh2025
UPDATE "User"
SET password = '$2b$10$NvLZs24LafWZwSZCXnv6UOamRVNOoHD7ZDEwMYtIlMqOHO55dIQcy'
WHERE email = 'galuh.inteko@gmail.com';

-- User 4: dilla.inteko@gmail.com
-- New password: Dilla2025
UPDATE "User"
SET password = '$2b$10$WbQWo1yuV4/ybNQvud/A.eQUTI1mdmXusbKwXxad3VARTc2r4A0L6'
WHERE email = 'dilla.inteko@gmail.com';

-- Verify the updates
SELECT id, name, email, role, credits,
       substring(password, 1, 20) as password_hash_preview
FROM "User"
WHERE email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
)
ORDER BY email;
