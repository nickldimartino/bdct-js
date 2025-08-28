require('dotenv').config();
const { spawnSync } = require('child_process');
const fs = require('fs');

function req(name) {
  const v = process.env[name];
  if (!v) { console.error(`❌ Missing env: ${name}`); process.exit(1); }
  return v;
}

const brokerBaseUrl = req('PACT_BROKER_BASE_URL');
const brokerToken   = req('PACT_BROKER_TOKEN');

const participant = process.env.PACTICIPANT || 'BDCT-JS-Provider';
let   version     = process.env.VERSION || '';

if (!version && process.env.VERSION_FILE) {
  try {
    version = fs.readFileSync(process.env.VERSION_FILE, 'utf8').trim();
  } catch (e) {
    console.error(`❌ Failed to read VERSION_FILE: ${process.env.VERSION_FILE}`);
    process.exit(1);
  }
}

if (!version) {
  console.error('❌ Missing VERSION or VERSION_FILE');
  process.exit(1);
}

const environment = process.env.ENVIRONMENT || 'test';

const args = [
  'can-i-deploy',
  '--pacticipant', participant,
  '--version', version,
  '--to-environment', environment,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken
];

console.log('▶️  pact-broker', args.join(' '));
const result = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
