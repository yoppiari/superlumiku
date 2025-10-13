# 🚀 RUN THIS COMMAND NOW

Copy **SELURUH block** di bawah ini dan paste ke **Coolify Terminal**:

```bash
psql "postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres" << 'EOF'
-- Step 1: Add missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS "accountType" TEXT DEFAULT 'payg', ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'free';

-- Step 2: Create/Update 4 enterprise users with correct schema
INSERT INTO users (id, email, password, name, role, "storageQuota", "storageUsed", "accountType", "subscriptionTier", "createdAt", "updatedAt")
VALUES
  ('ent-user-001', 'ardianfaisal.id@gmail.com', '$2b$10$5Li5j0Dv50sORiq6GstWdelBTdmpuzrbw/l1KKJVGP5RC4AbLBRKi', 'Ardian Faisal', 'user', 1073741824, 0, 'payg', 'free', NOW(), NOW()),
  ('ent-user-002', 'iqbal.elvo@gmail.com', '$2b$10$5Li5j0Dv50sORiq6GstWdelBTdmpuzrbw/l1KKJVGP5RC4AbLBRKi', 'Iqbal Elvo', 'user', 1073741824, 0, 'payg', 'free', NOW(), NOW()),
  ('ent-user-003', 'galuh.inteko@gmail.com', '$2b$10$5Li5j0Dv50sORiq6GstWdelBTdmpuzrbw/l1KKJVGP5RC4AbLBRKi', 'Galuh Inteko', 'user', 1073741824, 0, 'payg', 'free', NOW(), NOW()),
  ('ent-user-004', 'dilla.inteko@gmail.com', '$2b$10$5Li5j0Dv50sORiq6GstWdelBTdmpuzrbw/l1KKJVGP5RC4AbLBRKi', 'Dilla Inteko', 'user', 1073741824, 0, 'payg', 'free', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  "accountType" = EXCLUDED."accountType",
  "subscriptionTier" = EXCLUDED."subscriptionTier",
  "updatedAt" = NOW();

-- Step 3: Ensure 100,000 credits for each user
INSERT INTO credits (id, "userId", amount, balance, type, description, "createdAt")
SELECT 'credit-' || id, id, 100000, 100000, 'bonus', 'Enterprise unlimited credits', NOW()
FROM users WHERE email IN ('ardianfaisal.id@gmail.com', 'iqbal.elvo@gmail.com', 'galuh.inteko@gmail.com', 'dilla.inteko@gmail.com')
ON CONFLICT DO NOTHING;

-- Step 4: Verify all users
SELECT email, name, "accountType", "subscriptionTier", (SELECT COALESCE(SUM(balance), 0) FROM credits c WHERE c."userId" = u.id) as credits FROM users u WHERE email IN ('ardianfaisal.id@gmail.com', 'iqbal.elvo@gmail.com', 'galuh.inteko@gmail.com', 'dilla.inteko@gmail.com') ORDER BY email;
EOF
```

---

## Expected Output:

```
ALTER TABLE
INSERT 0 4
INSERT 0 4
                  email                  |      name      | accountType | subscriptionTier | credits
-----------------------------------------+----------------+-------------+------------------+---------
 ardianfaisal.id@gmail.com              | Ardian Faisal  | payg        | free             | 100000
 dilla.inteko@gmail.com                 | Dilla Inteko   | payg        | free             | 100000
 galuh.inteko@gmail.com                 | Galuh Inteko   | payg        | free             | 100000
 iqbal.elvo@gmail.com                   | Iqbal Elvo     | payg        | free             | 100000
(4 rows)
```

---

## After Running:

✅ Test login at: https://app.lumiku.com

**Credentials:**
- Email: `ardianfaisal.id@gmail.com`
- Password: `Lumiku2025!`

🎉 **Login akan berhasil!**
