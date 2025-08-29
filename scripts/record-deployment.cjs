// scripts/record-deployment.cjs
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
const environment   = req('ENVIRONMENT');
const pacticipant   = process.env.PACTICIPANT || 'BDCT-JS-Provider';

// VERSION or VERSION_FILE
let version = process.env.VERSION;
const versionFile = process.env.VERSION_FILE;
if (!version && versionFile) {
  try {
    version = fs.readFileSync(versionFile, 'utf8').trim();
  } catch (e) {
    console.error(`❌ Failed to read VERSION_FILE: ${versionFile}`);
    process.exit(1);
  }
}
if (!version) {
  console.error('❌ No VERSION provided and VERSION_FILE not found.');
  process.exit(1);
}

const args = [
  'record-deployment',
  '--pacticipant', pacticipant,
  '--version', version,
  '--environment', environment,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken,
];

console.log('▶️  pact-broker', args.join(' '));
const result = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
