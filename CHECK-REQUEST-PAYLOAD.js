// ============================================
// CHECK REQUEST PAYLOAD - INTERCEPT API CALL
// ============================================
//
// CARA PAKAI:
// 1. Buka https://dev.lumiku.com/apps/avatar-creator
// 2. Tekan F12 → Tab "Console"
// 3. Paste code ini ke Console
// 4. Tekan Enter
// 5. Coba create project lagi dari UI
// 6. Lihat di Console - akan muncul detail request!
//
// ============================================

console.clear();
console.log('%c🔍 INTERCEPTING API CALLS', 'font-size: 20px; font-weight: bold; color: #667eea');
console.log('='.repeat(70));
console.log('\n✅ Interceptor installed!');
console.log('📝 Now try to create a project from the UI...\n');
console.log('='.repeat(70));

// Save original fetch
const originalFetch = window.fetch;

// Override fetch
window.fetch = async function(...args) {
    const url = args[0];
    const options = args[1] || {};

    // Only intercept avatar-creator API calls
    if (typeof url === 'string' && url.includes('/api/apps/avatar-creator/projects')) {
        console.log('\n' + '='.repeat(70));
        console.log('%c📡 API CALL INTERCEPTED!', 'background: #ffc107; padding: 5px; font-weight: bold');
        console.log('='.repeat(70));
        console.log('\n📤 REQUEST DETAILS:');
        console.log('URL:', url);
        console.log('Method:', options.method || 'GET');
        console.log('\n📋 Headers:');
        if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
                if (key.toLowerCase() === 'authorization') {
                    console.log(`  ${key}:`, 'Bearer ' + value.replace('Bearer ', '').substring(0, 30) + '...');
                } else {
                    console.log(`  ${key}:`, value);
                }
            });
        }
        console.log('\n📦 Request Body:');
        if (options.body) {
            try {
                const bodyObj = JSON.parse(options.body);
                console.log(JSON.stringify(bodyObj, null, 2));

                // Validate body
                console.log('\n🔍 VALIDATION:');
                if (!bodyObj.name || bodyObj.name.trim() === '') {
                    console.log('%c❌ name is empty or missing!', 'color: red; font-weight: bold');
                } else {
                    console.log('%c✅ name is valid:', 'color: green', `"${bodyObj.name}"`);
                }

                if (bodyObj.description !== undefined) {
                    console.log('%c✅ description provided:', 'color: green', `"${bodyObj.description}"`);
                } else {
                    console.log('%c⚠️ description is undefined (optional)', 'color: orange');
                }
            } catch (e) {
                console.log('Body (raw):', options.body);
            }
        } else {
            console.log('(no body)');
        }
    }

    // Call original fetch
    const response = await originalFetch(...args);

    // Intercept response
    if (typeof url === 'string' && url.includes('/api/apps/avatar-creator/projects')) {
        console.log('\n📥 RESPONSE RECEIVED:');
        console.log('Status:', response.status, response.statusText);
        console.log('OK:', response.ok);

        // Clone response to read body
        const clonedResponse = response.clone();

        try {
            const data = await clonedResponse.json();
            console.log('\n📄 Response Body:');
            console.log(JSON.stringify(data, null, 2));

            if (!response.ok) {
                console.log('\n' + '='.repeat(70));
                console.log('%c❌ REQUEST FAILED!', 'background: #dc3545; color: white; padding: 5px; font-weight: bold');
                console.log('='.repeat(70));
                console.log('\n🔍 ERROR ANALYSIS:');
                console.log('Status Code:', response.status);
                console.log('Error:', data.error || 'Unknown');
                if (data.details) {
                    console.log('Details:', data.details);
                }
                if (data.code) {
                    console.log('Error Code:', data.code);
                }
                if (data.message) {
                    console.log('Message:', data.message);
                }

                console.log('\n💡 KEMUNGKINAN PENYEBAB:');
                if (response.status === 400) {
                    console.log('1. Validation error - data tidak valid');
                    console.log('2. name kosong atau terlalu panjang');
                    console.log('3. description terlalu panjang');
                    console.log('4. Format data salah');
                } else if (response.status === 401) {
                    console.log('1. Token invalid atau expired');
                    console.log('2. Authorization header tidak ada');
                } else if (response.status === 503) {
                    console.log('1. Database connection error');
                    console.log('2. Server sedang down');
                }
            } else {
                console.log('\n' + '='.repeat(70));
                console.log('%c✅ REQUEST SUCCESS!', 'background: #28a745; color: white; padding: 5px; font-weight: bold');
                console.log('='.repeat(70));
            }
        } catch (e) {
            console.log('Could not parse response body:', e);
        }

        console.log('\n' + '='.repeat(70));
        console.log('');
    }

    return response;
};

console.log('\n✅ Ready! Try creating a project now from the UI...');
console.log('👀 Watch this console for details!\n');
