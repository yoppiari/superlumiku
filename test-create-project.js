// Copy paste this entire script to browser console on dev.lumiku.com
// This will test if backend works correctly

console.log('🧪 Testing Avatar Creator API...\n')

// Get token from localStorage
const token = localStorage.getItem('token')
if (!token) {
  console.error('❌ No token found! Please login first.')
} else {
  console.log('✅ Token found:', token.substring(0, 20) + '...\n')
  
  // Test 1: Get all projects
  console.log('Test 1: GET /api/apps/avatar-creator/projects')
  fetch('/api/apps/avatar-creator/projects', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  })
  .then(r => r.text().then(text => ({status: r.status, text, ok: r.ok})))
  .then(({status, text, ok}) => {
    console.log('Status:', status)
    console.log('Response:', text)
    if (ok) {
      console.log('✅ GET projects works!\n')
      
      // Test 2: Create project
      console.log('Test 2: POST /api/apps/avatar-creator/projects')
      return fetch('/api/apps/avatar-creator/projects', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Direct API Test ' + Date.now(),
          description: 'Testing from console'
        })
      })
    } else {
      throw new Error('GET failed: ' + text)
    }
  })
  .then(r => r.text().then(text => ({status: r.status, text, ok: r.ok})))
  .then(({status, text, ok}) => {
    console.log('Status:', status)
    console.log('Response:', text)
    if (ok) {
      console.log('✅ CREATE project works!')
      console.log('\n🎉 Backend is working correctly!')
      console.log('Issue is in frontend code - need to check AvatarCreator component')
    } else {
      console.log('❌ CREATE project failed')
      console.log('Backend error detected')
      try {
        const err = JSON.parse(text)
        console.log('Error details:', err)
      } catch (e) {
        console.log('Raw error:', text)
      }
    }
  })
  .catch(e => {
    console.error('❌ Test failed:', e)
  })
}
