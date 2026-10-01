// Automated test suite for AI RecruitX Authentication API
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
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

async function runTests() {
  console.log('=== STARTING AI RECRUITX AUTHENTICATION TEST SUITE ===\n');

  // Test 1: Register a new recruiter with company and role
  const testEmail = `test_recruiter_${Date.now()}@acme.com`;
  console.log(`[1] Testing Registration: ${testEmail}`);
  const regRes = await request({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    full_name: 'Jordan Lee',
    email: testEmail,
    company_name: 'Acme Talent Group',
    role: 'Hiring Manager',
    password: 'Password123!'
  });
  console.log('Registration Status:', regRes.status);
  console.log('User registered:', regRes.data.user ? regRes.data.user.email : regRes.data);
  if (regRes.status !== 200) throw new Error('Registration failed');

  // Test 2: Invalid Login (wrong password)
  console.log('\n[2] Testing Invalid Login (wrong credentials)');
  const badLogin = await request({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testEmail,
    password: 'WrongPassword999'
  });
  console.log('Invalid Login Status:', badLogin.status, badLogin.data.detail);
  if (badLogin.status !== 401) throw new Error('Expected 401 on bad password');

  // Test 3: Valid Login
  console.log('\n[3] Testing Valid Login');
  const goodLogin = await request({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testEmail,
    password: 'Password123!'
  });
  console.log('Valid Login Status:', goodLogin.status);
  console.log('Token received:', goodLogin.data.access_token ? 'YES (JWT)' : 'NO');
  const token = goodLogin.data.access_token;
  if (!token) throw new Error('Expected access_token on good login');

  // Test 4: Forgot Password Flow
  console.log('\n[4] Testing Forgot Password endpoint');
  const forgotRes = await request({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/auth/forgot-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testEmail
  });
  console.log('Forgot Password Status:', forgotRes.status);
  console.log('Response message:', forgotRes.data.message);
  console.log('Dev reset token returned:', forgotRes.data.reset_token ? 'YES' : 'NO');
  const resetToken = forgotRes.data.reset_token;
  if (!resetToken) throw new Error('Expected reset_token in dev environment');

  // Test 5: Reset Password with token
  console.log('\n[5] Testing Reset Password endpoint with new password');
  const resetRes = await request({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/auth/reset-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    token: resetToken,
    new_password: 'NewStrongPassword456!',
    confirm_password: 'NewStrongPassword456!'
  });
  console.log('Reset Password Status:', resetRes.status);
  console.log('Response message:', resetRes.data.message);
  if (resetRes.status !== 200) throw new Error('Password reset failed');

  // Test 6: Verify Login with New Password
  console.log('\n[6] Testing Login with New Password');
  const reLogin = await request({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testEmail,
    password: 'NewStrongPassword456!'
  });
  console.log('Re-login with new password Status:', reLogin.status);
  if (reLogin.status !== 200) throw new Error('Re-login with new password failed');

  // Test 7: Verify Old Password No Longer Works
  console.log('\n[7] Testing Old Password is invalidated');
  const oldLogin = await request({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testEmail,
    password: 'Password123!'
  });
  console.log('Old Password Login Status (should be 401):', oldLogin.status);
  if (oldLogin.status !== 401) throw new Error('Old password should be rejected');

  console.log('\n ALL 7 AUTHENTICATION BACKEND INTEGRATION TESTS PASSED!');
}

runTests().catch(err => {
  console.error('\n Test Failure:', err.message);
  process.exit(1);
});
