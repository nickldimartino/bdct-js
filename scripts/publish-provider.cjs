// scripts/publish-provider.cjs
require('dotenv').config();
const { spawnSync } = require('child_process');

function req(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

const brokerBaseUrl = req('PACT_BROKER_BASE_URL');
const brokerToken   = req('PACT_BROKER_TOKEN');

const providerName  = process.env.PROVIDER_NAME || 'BDCT-JS-Provider';
const contractFile  = process.env.PROVIDER_CONTRACT || 'openapi/provider.generated.yaml';
const providerVer   = process.env.PROVIDER_VERSION || process.env.GITHUB_SHA || Date.now().toString();
const branch        = process.env.PROVIDER_BRANCH || process.env.GITHUB_REF_NAME || 'main';

// Self-verification metadata (optional, but needed for the UI stripe)
const verifyExit    = (process.env.PROVIDER_VERIFY_EXIT_CODE ?? '0').toString(); // "0" = green, "1" = red
const verifier      = process.env.PROVIDER_VERIFIER || 'jest';
const verifierVer   = process.env.PROVIDER_VERIFIER_VERSION || '30.0.5';

const args = [
  'pactflow', 'publish-provider-contract',
  contractFile,
  '--provider', providerName,
  '--provider-app-version', providerVer,
  '--branch', branch,
  '--content-type', 'application/yaml',
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken,
  // self-verification metadata
  '--verification-exit-code', verifyExit,
  '--verifier', verifier,
  '--verifier-version', verifierVer
];

console.log('▶️  npx --no-install', args.join(' '));
const result = spawnSync('npx', ['--no-install', ...args], { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
