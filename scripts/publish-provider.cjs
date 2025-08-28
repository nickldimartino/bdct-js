// scripts/publish-provider.cjs
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

const providerName    = process.env.PROVIDER_NAME   || 'BDCT-JS-Provider';
const providerBranch  = process.env.PROVIDER_BRANCH || 'main';
const contractPath    = process.env.PROVIDER_CONTRACT || 'openapi/provider.good.yaml';

let providerVersion = process.env.PROVIDER_VERSION;
if (!providerVersion || providerVersion.toLowerCase() === 'local') {
  try {
    const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
    if (r.status === 0) providerVersion = r.stdout.trim();
  } catch {}
}
if (!providerVersion || providerVersion.toLowerCase() === 'local') {
  providerVersion = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

// persist for subsequent can-i-deploy
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync(path.join('tmp', 'last-provider-version.txt'), providerVersion, 'utf8');

// infer content type
let contentType = 'application/yaml';
if (contractPath.endsWith('.json')) contentType = 'application/json';

const args = [
  'publish-provider-contract',
  '--provider', providerName,
  '--provider-app-version', providerVersion,
  '--branch', providerBranch,
  '--contract', contractPath,
  '--content-type', contentType,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken
];

console.log('▶️  pact-broker', args.join(' '));
const result = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
