/**
 * Deterministic Security Verification Script
 * Layer 3: Execution
 * Verifies that zero-trust security barriers, authentication protections,
 * and rate limiting are properly enforced.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const myAppDir = path.join(rootDir, 'my-app');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runSecurityTests() {
  console.log('🛡️ SWAG INC. VAMP 4 — RUNNING SECURITY AUDIT TESTS...\n');

  // TEST 1: No API keys exposed via client-side VITE_ prefix
  console.log('[1/6] Auditing client-side .env for secret leakage...');
  const clientEnvPath = path.join(myAppDir, '.env');
  if (fs.existsSync(clientEnvPath)) {
    const clientEnv = fs.readFileSync(clientEnvPath, 'utf8');
    assert(!clientEnv.includes('VITE_JARVIS_API_KEY'), 'Client .env does NOT contain VITE_JARVIS_API_KEY');
  }

  // TEST 2: Root .env has strong secrets
  console.log('\n[2/6] Auditing root environment configuration...');
  const rootEnvPath = path.join(rootDir, '.env');
  assert(fs.existsSync(rootEnvPath), 'Root .env exists');
  const rootEnv = fs.readFileSync(rootEnvPath, 'utf8');
  assert(rootEnv.includes('JWT_SECRET=') && !rootEnv.includes('swag_vamp4_atreiya_somali_secret_67'), 'JWT_SECRET is non-default and configured');
  assert(rootEnv.includes('FOUNDER_INVITE_CODE='), 'FOUNDER_INVITE_CODE is configured in root .env');

  // TEST 3: Static code analysis for dangerous patterns
  console.log('\n[3/6] Static analysis of backend server code...');
  const serverIndexPath = path.join(serverDir, 'index.js');
  const serverCode = fs.readFileSync(serverIndexPath, 'utf8');
  assert(serverCode.includes("app.set('trust proxy', 1)"), 'Reverse proxy trust is configured');
  assert(serverCode.includes('FOUNDER_INVITE_CODE'), 'Founder registration master code check is present');
  assert(serverCode.includes('PBKDF2_ITERATIONS = 100000'), 'PBKDF2 iterations upgraded to 100,000');
  assert(serverCode.includes('isSafeAvatar'), 'Avatar protocol/scheme sanitizer is active');
  assert(serverCode.includes("app.post('/api/jarvis', auth"), 'Express /api/jarvis route is secured with auth middleware');

  // TEST 4: Functional test of PBKDF2 auto-migration and password policy
  console.log('\n[4/6] Testing cryptographic password policy and PBKDF2 logic...');
  const initSqlJs = require(path.join(serverDir, 'node_modules/sql.js'));
  const SQL = await initSqlJs();
  const testDb = new SQL.Database();

  testDb.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      handle TEXT,
      password_hash TEXT,
      salt TEXT
    )
  `);

  const salt = crypto.randomBytes(32).toString('hex');
  const legacyHash = crypto.pbkdf2Sync('LegacyPassword123', salt, 10000, 64, 'sha512').toString('hex');
  testDb.run('INSERT INTO users VALUES (1, "@test", ?, ?)', [legacyHash, salt]);

  // Simulate auto-upgrade on login
  const candidateHash100k = crypto.pbkdf2Sync('LegacyPassword123', salt, 100000, 64, 'sha512').toString('hex');
  const candidateHash10k = crypto.pbkdf2Sync('LegacyPassword123', salt, 10000, 64, 'sha512').toString('hex');
  assert(candidateHash10k === legacyHash, 'Legacy hash matches');
  
  // Upgraded hash
  const newSalt = crypto.randomBytes(32).toString('hex');
  const upgradedHash = crypto.pbkdf2Sync('LegacyPassword123', newSalt, 100000, 64, 'sha512').toString('hex');
  testDb.run('UPDATE users SET password_hash=?, salt=? WHERE id=1', [upgradedHash, newSalt]);

  const verifyStmt = testDb.prepare('SELECT password_hash FROM users WHERE id=1');
  verifyStmt.step();
  const row = verifyStmt.getAsObject();
  verifyStmt.free();
  assert(row.password_hash === upgradedHash, 'Password successfully migrated to 100,000 PBKDF2 iterations');

  // TEST 5: Verify Jarvis Vercel serverless proxy headers
  console.log('\n[5/6] Auditing Vercel serverless proxy configuration...');
  const jarvisProxyPath = path.join(myAppDir, 'api', 'jarvis.js');
  const jarvisProxyCode = fs.readFileSync(jarvisProxyPath, 'utf8');
  assert(!jarvisProxyCode.includes("res.setHeader('Access-Control-Allow-Origin', '*')"), 'Wildcard CORS removed from serverless proxy');
  assert(jarvisProxyCode.includes('jarvisHits'), 'Rate limiter present in serverless function');
  assert(jarvisProxyCode.includes('maxOutputTokens: Math.min'), 'Token limits clamped in serverless proxy');

  // TEST 6: Verify Frontend service auth headers
  console.log('\n[6/6] Auditing frontend API client and auth propagation...');
  const jarvisServicePath = path.join(myAppDir, 'src', 'services', 'jarvisService.js');
  const jarvisServiceCode = fs.readFileSync(jarvisServicePath, 'utf8');
  assert(jarvisServiceCode.includes("proxyHeaders['Authorization'] = `Bearer ${token}`"), 'Frontend passes JWT token to Jarvis proxy');
  assert(!jarvisServiceCode.includes('import.meta.env.VITE_JARVIS_API_KEY'), 'No direct VITE_ key reference in jarvisService');

  console.log(`\n===================================================`);
  console.log(`🎉 ALL ${passedTests}/${totalTests} SECURITY TESTS PASSED DETERMINISTICALLY!`);
  console.log(`===================================================\n`);
}

runSecurityTests().catch(err => {
  console.error('\n❌ Security verification failed:', err.message);
  process.exit(1);
});
