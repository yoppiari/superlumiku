-- Fix password hash for 4 enterprise users
-- Correct hash for password: Lumiku2025!

UPDATE users
SET password = '$2b$10$9oRZeIlTr/f9NmIjCx/JjOsFG6JXrFGqywVYwSrqeuFG77U1oc44O'
WHERE email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
);

-- Verify update
SELECT email, name, LEFT(password, 30) as password_hash
FROM users
WHERE email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
);
