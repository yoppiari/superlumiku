-- Create 4 Enterprise Users with UNLIMITED access (NO credit charge)
-- Run this in production PostgreSQL database

-- User 1: ardianfaisal.id@gmail.com
INSERT INTO users (id, email, password, name, role, "storageQuota", "storageUsed", "createdAt", "updatedAt")
VALUES (
  'ent-user-001',
  'ardianfaisal.id@gmail.com',
  '$2b$10$U9Xn0SzBi6xBAdD.25JzbeYHyCdDNyvTM8tEkr5P33z0iRreJ53bi', -- Password: Lumiku2025!
  'Ardian Faisal',
  'user',
  10737418240, -- 10GB
  0,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- User 2: iqbal.elvo@gmail.com
INSERT INTO users (id, email, password, name, role, "storageQuota", "storageUsed", "createdAt", "updatedAt")
VALUES (
  'ent-user-002',
  'iqbal.elvo@gmail.com',
  '$2b$10$U9Xn0SzBi6xBAdD.25JzbeYHyCdDNyvTM8tEkr5P33z0iRreJ53bi', -- Password: Lumiku2025!
  'Iqbal Elvo',
  'user',
  10737418240,
  0,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- User 3: galuh.inteko@gmail.com
INSERT INTO users (id, email, password, name, role, "storageQuota", "storageUsed", "createdAt", "updatedAt")
VALUES (
  'ent-user-003',
  'galuh.inteko@gmail.com',
  '$2b$10$U9Xn0SzBi6xBAdD.25JzbeYHyCdDNyvTM8tEkr5P33z0iRreJ53bi', -- Password: Lumiku2025!
  'Galuh Inteko',
  'user',
  10737418240,
  0,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- User 4: dilla.inteko@gmail.com
INSERT INTO users (id, email, password, name, role, "storageQuota", "storageUsed", "createdAt", "updatedAt")
VALUES (
  'ent-user-004',
  'dilla.inteko@gmail.com',
  '$2b$10$U9Xn0SzBi6xBAdD.25JzbeYHyCdDNyvTM8tEkr5P33z0iRreJ53bi', -- Password: Lumiku2025!
  'Dilla Inteko',
  'user',
  10737418240,
  0,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Give each user 100000 credits (effectively unlimited)
INSERT INTO credits (id, "userId", amount, balance, type, description, "createdAt")
SELECT
  'credit-' || id,
  id,
  100000,
  100000,
  'bonus',
  'Enterprise unlimited credits',
  NOW()
FROM users
WHERE email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
)
ON CONFLICT DO NOTHING;

-- Verify users created
SELECT email, name, role FROM users WHERE email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
);
