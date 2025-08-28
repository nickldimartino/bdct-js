require('dotenv').config({ path: '.env' });
const { spawnSync } = require('child_process');

function req(name) {
  const v = process.env[name];
  if (!v) { console.error(`❌ Missing env: ${name}`); process.exit(1); }
  return v;
}

const brokerBaseUrl = req('PACT_BROKER_BASE_URL');
const brokerToken   = req('PACT_BROKER_TOKEN');

const providerName  = process.env.PROVIDER_NAME || 'BDCT-JS-Provider';
const providerVer   = process.env.PROVIDER_VERSION || process.env.GITHUB_SHA || 'local';
const providerBranch= process.env.PROVIDER_BRANCH || process.env.BRANCH || 'main';
const contractPath  = process.env.PROVIDER_CONTRACT || 'openapi/provider.generated.yaml';
const contentType   = process.env.PROVIDER_CONTENT_TYPE || 'application/yaml';

const args = [
  'publish-provider-contract',
  '--provider', providerName,
  '--provider-app-version', providerVer,
  '--branch', providerBranch,
  '--contract', contractPath,
  '--content-type', contentType,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken
];

console.log('▶️  pactflow', args.join(' '));
const result = spawnSync('pactflow', args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
