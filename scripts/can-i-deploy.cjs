// scripts/can-i-deploy.cjs
require('dotenv').config({ path: '.env' });
const { spawnSync } = require('child_process');
const fs = require('fs');

function req(name) {
  const v = process.env[name];
  if (!v) { console.error(`❌ Missing env: ${name}`); process.exit(1); }
  return v;
}

const brokerBaseUrl = req('PACT_BROKER_BASE_URL');
const brokerToken   = req('PACT_BROKER_TOKEN');
const pacticipant   = req('PACTICIPANT');
const envName       = process.env.ENVIRONMENT || 'test';

// Version: prefer VERSION env, fallback to VERSION_FILE if it exists
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

const args = [
  'can-i-deploy',
  '--pacticipant', pacticipant,
  '--version', version,
  '--to-environment', envName,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken
];

console.log('▶️  pact-broker', args.join(' '));
const r = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true });
process.exit(r.status ?? 1);
