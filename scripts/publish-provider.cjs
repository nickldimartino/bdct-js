// scripts/publish-provider.cjs
require('dotenv').config({ path: '.env' });
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

const providerName  = process.env.PROVIDER_NAME   || 'BDCT-JS-Provider';
const contractPath  = process.env.PROVIDER_CONTRACT || 'openapi/provider.generated.yaml';
const branch        = process.env.PROVIDER_BRANCH || process.env.GITHUB_REF_NAME || 'main';

// provider version: explicit > GITHUB_SHA > timestamp
let providerVersion = process.env.PROVIDER_VERSION
  || process.env.GITHUB_SHA
  || String(Date.now());

// self-verification metadata (purely informational)
const verifier        = process.env.PROVIDER_VERIFIER         || 'jest';
const verifierVersion = process.env.PROVIDER_VERIFIER_VERSION || 'local';
const verifyExitCode  = (process.env.PROVIDER_VERIFY_EXIT_CODE ?? '0').trim();

// write a tiny JSON self-verification artifact
fs.mkdirSync('tmp', { recursive: true });
const verifyJsonPath = path.join('tmp', 'provider-self-verify.json');
const verifyPayload = {
  result: verifyExitCode === '0' ? 'passed' : 'failed',
  verifiedAt: new Date().toISOString(),
  verifier,
  verifierVersion
};
fs.writeFileSync(verifyJsonPath, JSON.stringify(verifyPayload, null, 2));

// build CLI
const args = [
  'publish-provider-contract',
  contractPath,
  '--provider', providerName,
  '--provider-app-version', providerVersion,
  '--branch', branch,
  '--content-type', 'application/yaml',
  '--verification-results', verifyJsonPath,
  '--verification-results-content-type', 'application/json',
  '--verifier', verifier,
  '--verifier-version', verifierVersion,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken,
];

console.log('▶️  pactflow', args.join(' '));
const result = spawnSync('pactflow', args, { stdio: 'inherit', shell: true });

if ((result.status ?? 1) === 0) {
  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/last-provider-version.txt', providerVersion.trim());
  console.log(`📝 Wrote provider version to tmp/last-provider-version.txt (${providerVersion})`);
}

process.exit(result.status ?? 1);
