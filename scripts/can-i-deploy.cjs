require('dotenv').config({ path: '.env' }); // Load env vars from .env file
const { spawnSync } = require('child_process'); // To run pact-broker CLI
const fs = require('fs');

// Helper to enforce required env variables
function req(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

// ✅ Required environment variables
const brokerBaseUrl = req('PACT_BROKER_BASE_URL'); // Broker/Pactflow base URL
const brokerToken   = req('PACT_BROKER_TOKEN');    // Auth token
const pacticipant   = req('PACTICIPANT');          // Service name (consumer or provider)
const envName       = process.env.ENVIRONMENT || 'test'; // Target environment (default: test)

// --------------------------
// Resolve version
// --------------------------
// Priority: VERSION env > VERSION_FILE > fail
let version = process.env.VERSION;
if (!version) {
  const vf = process.env.VERSION_FILE;
  if (vf && fs.existsSync(vf)) {
    version = fs.readFileSync(vf, 'utf8').trim();
  }
}
if (!version) {
  console.error('❌ No VERSION provided and VERSION_FILE not found.');
  process.exit(1);
}

// --------------------------
// Build pact-broker CLI args
// --------------------------
const args = [
  'can-i-deploy',
  '--pacticipant', pacticipant,
  '--version', version,
  '--to-environment', envName,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken,
];

// Print the command so you can see what’s happening in logs
console.log('▶️  pact-broker', args.join(' '));

// Run the pact-broker can-i-deploy check
const r = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true });

// Exit with the same status (0 = success, 1 = failure)
process.exit(r.status ?? 1);
