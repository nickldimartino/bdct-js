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
const participant   = req('PACTICIPANT');
const envName       = process.env.ENVIRONMENT || 'test';

let version = process.env.VERSION || '';
if (!version) {
  const vf = process.env.VERSION_FILE;
  if (vf) {
    try {
      version = fs.readFileSync(vf, 'utf8').trim();
    } catch (e) {
      console.error(`❌ Failed to read VERSION_FILE: ${vf}`);
      process.exit(1);
    }
  }
}
if (!version) version = process.env.GITHUB_SHA || '';

if (!version) {
  console.error('❌ No version found. Set VERSION or VERSION_FILE (or GITHUB_SHA).');
  process.exit(1);
}

const args = [
  'can-i-deploy',
  '--pacticipant', participant,
  '--version', version,
  '--to-environment', envName,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken
];

console.log('▶️  pact-broker', args.join(' '));
const result = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
