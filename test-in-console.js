// ===================================================
// TEST CREATE PROJECT - RUN IN DEV.LUMIKU.COM CONSOLE
// ===================================================
//
// CARA PAKAI:
// 1. Buka https://dev.lumiku.com (pastikan sudah login!)
// 2. Tekan F12 → Tab "Console"
// 3. Copy SEMUA code di file ini
// 4. Paste ke Console
// 5. Tekan Enter
// 6. Lihat hasilnya!
//
// ===================================================

(async function testCreateProject() {
    console.log('🧪 TESTING CREATE PROJECT...\n');

    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('❌ ERROR: No token found! Please login first.');
        return;
    }

    console.log('✅ Token found:', token.substring(0, 20) + '...');
    console.log('\n📤 Sending request to:', 'https://dev.lumiku.com/api/apps/avatar-creator/projects');

    const payload = {
        name: "Test Production Fix " + Date.now(),
        description: "Testing create project fix in production"
    };

    console.log('📦 Payload:', payload);
    console.log('\n⏳ Waiting for response...\n');

    try {
        const response = await fetch('https://dev.lumiku.com/api/apps/avatar-creator/projects', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('📊 HTTP Status:', response.status);
        console.log('📊 Status Text:', response.statusText);
        console.log('\n📥 Response Data:');
        console.log(JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ ✅ ✅ SUCCESS! Project created!');
            console.log('🎉 Project ID:', data.project?.id);
            console.log('🎉 Project Name:', data.project?.name);

            // Clean up - delete test project
            if (data.project?.id) {
                console.log('\n🧹 Cleaning up - deleting test project...');
                const deleteResponse = await fetch(`https://dev.lumiku.com/api/apps/avatar-creator/projects/${data.project.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (deleteResponse.ok) {
                    console.log('✅ Test project deleted');
                }
            }
        } else {
            console.log('\n❌ ❌ ❌ FAILED! Error creating project');
            console.log('\n🔍 ERROR DETAILS:');
            console.log('Error:', data.error);
            if (data.code) console.log('Error Code:', data.code);
            if (data.details) console.log('Details:', data.details);
            if (data.message) console.log('Message:', data.message);

            // Show helpful debugging info
            console.log('\n🛠️ DEBUGGING INFO:');
            console.log('- Status Code:', response.status);
            console.log('- Response Headers:', Object.fromEntries(response.headers.entries()));
        }

    } catch (error) {
        console.error('\n❌ ❌ ❌ NETWORK ERROR:');
        console.error(error.message);
        console.error(error);
    }

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETED');
    console.log('='.repeat(60));
})();
