# Cara Update Password 4 Enterprise Users

## Password Baru (Sederhana & Berbeda):

1. **Ardian Faisal** - ardianfaisal.id@gmail.com → `Ardian2025`
2. **Iqbal Elvo** - iqbal.elvo@gmail.com → `Iqbal2025`
3. **Galuh Inteko** - galuh.inteko@gmail.com → `Galuh2025`
4. **Dilla Inteko** - dilla.inteko@gmail.com → `Dilla2025`

## Cara Menjalankan:

### Option 1: Via Coolify Console

1. Buka Coolify dashboard di https://cf.avolut.com
2. Masuk ke aplikasi Lumiku (jws8c80ckos00og0cos4cw8s)
3. Klik tab "Terminal" atau "Console"
4. Upload file `update-passwords-script.js` ke dalam container
5. Jalankan command:
```bash
node update-passwords-script.js
```

### Option 2: Via SSH ke Server Coolify

1. SSH ke server Coolify
2. Cari container ID untuk aplikasi backend:
```bash
docker ps | grep lumiku
```
3. Copy file script ke dalam container:
```bash
docker cp update-passwords-script.js <container-id>:/app/
```
4. Exec ke dalam container dan jalankan:
```bash
docker exec -it <container-id> node /app/update-passwords-script.js
```

### Option 3: Via Database Direct (Paling Cepat)

Jika Anda punya akses langsung ke database PostgreSQL di Coolify:

```bash
# Generate bcrypt hash untuk setiap password terlebih dahulu
# Atau gunakan script Node.js kecil ini:

node -e "
const bcrypt = require('bcryptjs');
const passwords = {
  'ardianfaisal.id@gmail.com': 'Ardian2025',
  'iqbal.elvo@gmail.com': 'Iqbal2025',
  'galuh.inteko@gmail.com': 'Galuh2025',
  'dilla.inteko@gmail.com': 'Dilla2025'
};

for (const [email, pass] of Object.entries(passwords)) {
  const hash = bcrypt.hashSync(pass, 10);
  console.log(\`-- \${email}\`);
  console.log(\`UPDATE \\\"User\\\" SET password = '\${hash}' WHERE email = '\${email}';\`);
  console.log('');
}
"
```

Kemudian jalankan SQL output di database production.

## Verifikasi

Setelah update, coba login dengan credentials baru di https://app.lumiku.com
