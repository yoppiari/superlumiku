// ============================================
// FINAL TEST - RUN IN DEV.LUMIKU.COM CONSOLE
// ============================================
//
// CARA PAKAI:
// 1. Buka https://dev.lumiku.com (HARUS sudah login!)
// 2. Tekan F12 → Tab "Console"
// 3. Copy SEMUA code ini
// 4. Paste ke Console
// 5. Tekan Enter
// 6. SCREENSHOT HASILNYA!
//
// ============================================

console.clear();
console.log('%c🧪 TESTING CREATE PROJECT IN PRODUCTION', 'font-size: 20px; font-weight: bold; color: #667eea');
console.log('='.repeat(70));

(async function testCreateProject() {
    // Get token
    const token = localStorage.getItem('token');

    if (!token) {
        console.log('%c❌ ERROR: Token tidak ditemukan!', 'color: red; font-weight: bold; font-size: 16px');
        console.log('\n⚠️ Pastikan Anda sudah LOGIN di dev.lumiku.com!');
        return;
    }

    console.log('\n✅ Token found');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('Token length:', token.length, 'characters');

    // Prepare request
    const url = 'https://dev.lumiku.com/api/apps/avatar-creator/projects';
    const payload = {
        name: "Test Production Fix " + Date.now(),
        description: "Testing create project fix - Final test"
    };

    console.log('\n📤 Sending POST request to:', url);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    console.log('\n⏳ Waiting for response...\n');

    try {
        const startTime = Date.now();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        const data = await response.json();

        console.log('='.repeat(70));
        console.log('%c📊 RESPONSE RECEIVED', 'font-size: 16px; font-weight: bold; color: #007bff');
        console.log('='.repeat(70));
        console.log('\n⏱️  Response time:', duration + 'ms');
        console.log('📊 HTTP Status:', response.status, response.statusText);
        console.log('\n📥 Response Headers:');
        response.headers.forEach((value, key) => {
            console.log(`  ${key}:`, value);
        });

        console.log('\n📥 Response Body:');
        console.log(JSON.stringify(data, null, 2));

        console.log('\n' + '='.repeat(70));

        if (response.ok) {
            // SUCCESS!
            console.log('%c✅ ✅ ✅ SUCCESS! PROJECT CREATED!', 'background: #28a745; color: white; padding: 10px; font-size: 18px; font-weight: bold');
            console.log('\n🎉 Project Details:');
            console.log('  ID:', data.project?.id);
            console.log('  Name:', data.project?.name);
            console.log('  Description:', data.project?.description);
            console.log('  Created At:', data.project?.createdAt);
            console.log('  User ID:', data.project?.userId);

            console.log('\n' + '='.repeat(70));
            console.log('%c🎊 MASALAH SUDAH FIXED! 🎊', 'background: #28a745; color: white; padding: 10px; font-size: 20px; font-weight: bold; text-align: center');
            console.log('%cCreate project API bekerja dengan baik!', 'color: #28a745; font-weight: bold; font-size: 16px');
            console.log('='.repeat(70));

            // Clean up - delete test project
            if (data.project?.id) {
                console.log('\n🧹 Cleaning up test project...');
                const deleteResponse = await fetch(`https://dev.lumiku.com/api/apps/avatar-creator/projects/${data.project.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (deleteResponse.ok) {
                    console.log('✅ Test project deleted successfully');
                } else {
                    console.log('⚠️ Could not delete test project (not critical)');
                }
            }

        } else {
            // ERROR
            console.log('%c❌ ❌ ❌ ERROR: PROJECT CREATION FAILED', 'background: #dc3545; color: white; padding: 10px; font-size: 18px; font-weight: bold');

            console.log('\n🔍 ERROR DETAILS:');
            console.log('  Status Code:', response.status);
            console.log('  Error Message:', data.error || 'Unknown error');
            if (data.code) console.log('  Error Code:', data.code);
            if (data.details) {
                console.log('  Details:');
                console.log(JSON.stringify(data.details, null, 2));
            }
            if (data.message) console.log('  Message:', data.message);

            console.log('\n💡 ANALISIS:');

            if (response.status === 401) {
                console.log('%c⚠️ UNAUTHORIZED - Token invalid atau expired', 'color: orange; font-weight: bold');
                console.log('Solusi: Logout dan login ulang');
            } else if (response.status === 400) {
                console.log('%c⚠️ BAD REQUEST - Kemungkinan:','color: orange; font-weight: bold');
                console.log('  1. Validation error (data tidak valid)');
                console.log('  2. Database constraint error');
                console.log('  3. Missing required fields');

                if (data.details) {
                    console.log('\n  Validation errors:');
                    console.table(data.details);
                }
            } else if (response.status === 503) {
                console.log('%c⚠️ SERVICE UNAVAILABLE - Database connection error', 'color: orange; font-weight: bold');
                console.log('Solusi: Check database connection di server');
            } else {
                console.log('%c⚠️ Unknown error type', 'color: orange; font-weight: bold');
            }

            console.log('\n' + '='.repeat(70));
            console.log('%c❌ MASALAH MASIH ADA!', 'background: #dc3545; color: white; padding: 10px; font-size: 20px; font-weight: bold');
            console.log('='.repeat(70));
        }

    } catch (error) {
        console.log('='.repeat(70));
        console.log('%c❌ NETWORK ERROR', 'background: #dc3545; color: white; padding: 10px; font-size: 18px; font-weight: bold');
        console.log('='.repeat(70));
        console.error('\nError:', error);
        console.log('\nStack trace:', error.stack);

        console.log('\n💡 Kemungkinan penyebab:');
        console.log('  1. Server tidak merespon');
        console.log('  2. CORS error');
        console.log('  3. Network timeout');
        console.log('  4. SSL/TLS error');
    }

    console.log('\n' + '='.repeat(70));
    console.log('%cTEST COMPLETED', 'font-size: 18px; font-weight: bold; color: #667eea');
    console.log('='.repeat(70));
    console.log('\n📸 SCREENSHOT HASIL INI DAN KIRIM KE CLAUDE!');
    console.log('\n');

})();
