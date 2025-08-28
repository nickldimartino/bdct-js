// scripts/publish-provider.cjs
require('dotenv').config({ path: '.env' });
const { spawnSync } = require('child_process');

function req(name) {
  const v = process.env[name];
  if (!v) { console.error(`❌ Missing env: ${name}`); process.exit(1); }
  return v;
}

const brokerBaseUrl = req('PACT_BROKER_BASE_URL');
const brokerToken   = req('PACT_BROKER_TOKEN');

const providerName  = process.env.PROVIDER_NAME   || 'CDCT-JS-Provider';
const providerVer   = process.env.PROVIDER_VERSION || process.env.GITHUB_SHA || Date.now().toString();
const providerBranch= process.env.PROVIDER_BRANCH || process.env.GITHUB_REF_NAME || 'main';
const contractPath  = process.env.PROVIDER_CONTRACT || 'openapi/openapi.yaml';

// NOTE: If your CLI errors on '--specification oas', try '--specification openapi' instead.
const args = [
  'publish-provider-contract',
  '--provider', providerName,
  '--provider-app-version', providerVer,
  '--branch', providerBranch,
  '--contract', contractPath,
  '--content-type', 'application/yaml',
  '--specification', 'oas',
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken
];

console.log('▶️  pact-broker', args.join(' '));
const result = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
