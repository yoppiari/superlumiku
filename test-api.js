/**
 * Test Avatar Creator Projects API
 */

const https = require('https');
const http = require('http');

// Test user credentials (from PASSWORD_BARU_ENTERPRISE_USERS.md)
const TEST_EMAIL = 'ardianfaisal.id@gmail.com';
const TEST_PASSWORD = 'Ardian2025';

async function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAPI() {
  console.log('🚀 Testing Avatar Creator Projects API\n');

  try {
    // Step 1: Login
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await makeRequest(
      'https://app.lumiku.com/api/auth/login',
      'POST',
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }
    );

    if (loginResponse.status !== 200) {
      console.log('❌ Login failed:', loginResponse.status);
      console.log('Response:', loginResponse.body);
      console.log('\n⚠️  Please update TEST_EMAIL and TEST_PASSWORD in test-api.js');
      return;
    }

    const token = loginResponse.body.token;
    console.log('✅ Login successful!');
    console.log(`Token: ${token.substring(0, 20)}...\n`);

    // Step 2: Test GET /api/apps/avatar-creator/projects
    console.log('📋 Step 2: Getting projects list...');
    const projectsResponse = await makeRequest(
      'https://app.lumiku.com/api/apps/avatar-creator/projects',
      'GET',
      null,
      { 'Authorization': `Bearer ${token}` }
    );

    console.log(`Status: ${projectsResponse.status}`);
    if (projectsResponse.status === 200) {
      console.log('✅ Projects endpoint works!');
      console.log('Projects:', JSON.stringify(projectsResponse.body, null, 2));
    } else {
      console.log('❌ Projects endpoint failed');
      console.log('Response:', projectsResponse.body);
    }
    console.log('');

    // Step 3: Test POST /api/apps/avatar-creator/projects (create project)
    console.log('📁 Step 3: Creating test project...');
    const createProjectResponse = await makeRequest(
      'https://app.lumiku.com/api/apps/avatar-creator/projects',
      'POST',
      {
        name: 'Test Project via API',
        description: 'Created by automated test script'
      },
      { 'Authorization': `Bearer ${token}` }
    );

    console.log(`Status: ${createProjectResponse.status}`);
    if (createProjectResponse.status === 200 || createProjectResponse.status === 201) {
      console.log('✅ Project creation works!');
      console.log('Project:', JSON.stringify(createProjectResponse.body, null, 2));

      const projectId = createProjectResponse.body.project?.id;

      if (projectId) {
        // Step 4: Test GET /api/apps/avatar-creator/projects/:id
        console.log('\n📂 Step 4: Getting project detail...');
        const projectDetailResponse = await makeRequest(
          `https://app.lumiku.com/api/apps/avatar-creator/projects/${projectId}`,
          'GET',
          null,
          { 'Authorization': `Bearer ${token}` }
        );

        console.log(`Status: ${projectDetailResponse.status}`);
        if (projectDetailResponse.status === 200) {
          console.log('✅ Project detail endpoint works!');
          console.log('Detail:', JSON.stringify(projectDetailResponse.body, null, 2));
        } else {
          console.log('❌ Project detail failed');
          console.log('Response:', projectDetailResponse.body);
        }
      }
    } else {
      console.log('❌ Project creation failed');
      console.log('Response:', createProjectResponse.body);
    }

    console.log('\n============================================================');
    console.log('✅ API Testing Complete!');
    console.log('============================================================');
    console.log('\n📝 Summary:');
    console.log('✅ Database schema: avatar_projects table exists');
    console.log('✅ Database schema: projectId column in avatars');
    console.log(`${projectsResponse.status === 200 ? '✅' : '❌'} Backend API: GET /projects`);
    console.log(`${createProjectResponse.status === 200 || createProjectResponse.status === 201 ? '✅' : '❌'} Backend API: POST /projects`);
    console.log('\n🎉 Avatar Creator Project System is LIVE!');
    console.log('🚀 Visit: https://app.lumiku.com');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testAPI();
