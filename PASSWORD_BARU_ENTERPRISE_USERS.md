# Password Baru - 4 Enterprise Users

## Credentials Update (Sederhana & Berbeda)

### User 1: Ardian Faisal
- **Email:** ardianfaisal.id@gmail.com
- **Password:** `Ardian2025`
- **Credits:** 100,000
- **Access:** Video Mixer & Carousel Mix (Unlimited)

### User 2: Iqbal Elvo
- **Email:** iqbal.elvo@gmail.com
- **Password:** `Iqbal2025`
- **Credits:** 100,000
- **Access:** Video Mixer & Carousel Mix (Unlimited)

### User 3: Galuh Inteko
- **Email:** galuh.inteko@gmail.com
- **Password:** `Galuh2025`
- **Credits:** 100,000
- **Access:** Video Mixer & Carousel Mix (Unlimited)

### User 4: Dilla Inteko
- **Email:** dilla.inteko@gmail.com
- **Password:** `Dilla2025`
- **Credits:** 100,000
- **Access:** Video Mixer & Carousel Mix (Unlimited)

---

## Cara Update di Database Production

### Method 1: Jalankan SQL File
```bash
# SSH ke server Coolify, lalu:
docker exec -i <postgres-container-id> psql -U postgres -d postgres < update-passwords.sql
```

### Method 2: Jalankan Node Script
```bash
# Copy script ke container backend:
docker cp update-passwords-script.js <backend-container-id>:/app/

# Execute script:
docker exec -it <backend-container-id> node /app/update-passwords-script.js
```

### Method 3: Manual SQL (Copy-Paste)
Buka Coolify → Database → Query, lalu copy-paste isi file `update-passwords.sql`

---

## Test Login
Setelah update, coba login di: **https://app.lumiku.com**

Gunakan salah satu kombinasi email & password di atas.
