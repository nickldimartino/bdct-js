// scripts/publish-consumer.cjs
require('dotenv').config();
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function req(name) {
  const v = process.env[name];
  if (!v) { console.error(`❌ Missing env: ${name}`); process.exit(1); }
  return v;
}

const brokerBaseUrl = req('PACT_BROKER_BASE_URL');
const brokerToken   = req('PACT_BROKER_TOKEN');
const branch        = process.env.BRANCH || 'main';

// Determine a unique consumer version (prefer Git SHA)
let consumerVersion = process.env.CONSUMER_VERSION;
if (!consumerVersion || consumerVersion.toLowerCase() === 'local') {
  try {
    const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
    if (r.status === 0) consumerVersion = r.stdout.trim();
  } catch {}
}
if (!consumerVersion || consumerVersion.toLowerCase() === 'local') {
  consumerVersion = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

// persist for subsequent can-i-deploy
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(path.join('tmp', 'last-consumer-version.txt'), consumerVersion, 'utf8');

const args = [
  'publish', './pacts',
  '--branch', branch,
  '--tag', branch,
  '--consumer-app-version', consumerVersion,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken
];

console.log('▶️  pact-broker', args.join(' '));
const result = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
