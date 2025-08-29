#!/usr/bin/env node
require('dotenv').config({ path: '.env' });
const { spawnSync } = require('child_process');
const fs = require('fs');

function req(name) {
  const v = process.env[name];
  if (!v) { console.error(`❌ Missing env: ${name}`); process.exit(1); }
  return v;
}

// Required env
const brokerBaseUrl     = req('PACT_BROKER_BASE_URL');
const brokerToken       = req('PACT_BROKER_TOKEN');
const providerContract  = req('PROVIDER_CONTRACT');

// Optional env
const providerBranch    = process.env.PROVIDER_BRANCH || process.env.BRANCH || process.env.GITHUB_REF_NAME || 'main';
let   providerVersion   = process.env.PROVIDER_VERSION || process.env.GITHUB_SHA || Date.now().toString();
const verifier          = process.env.PROVIDER_VERIFIER || 'jest';
const verifierVersion   = process.env.PROVIDER_VERIFIER_VERSION || 'local';

// Derive success from exit code (0 = success)
const exitCodeRaw       = process.env.PROVIDER_VERIFY_EXIT_CODE;
const success           = (exitCodeRaw === undefined) ? true : String(exitCodeRaw) === '0';

// Minimal self-verification payload (file content is required by the API)
fs.mkdirSync('tmp', { recursive: true });
const resultsPath = 'tmp/provider-self--verify.json';
const resultsBody = {
  success,
  verifier,
  verifierVersion,
  executedAt: new Date().toISOString()
};
fs.writeFileSync(resultsPath, JSON.stringify(resultsBody, null, 2));

// Build CLI args
const args = [
  'publish-provider-contract',
  providerContract,
  '--provider', 'BDCT-JS-Provider',
  '--provider-app-version', providerVersion,
  '--branch', providerBranch,
  '--content-type', 'application/yaml',
  '--verification-results', resultsPath,
  '--verification-results-content-type', 'application/json',
  '--verification-success', success ? 'true' : 'false',
  '--verifier', verifier,
  '--verifier-version', verifierVersion,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken
];

console.log('▶️  pactflow', args.join(' '));
const result = spawnSync('pactflow', args, { stdio: 'inherit', shell: true });

if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);

// Persist provider version for can-i-deploy + record-deployment
fs.writeFileSync('tmp/last-provider-version.txt', String(providerVersion));
console.log(`📝 Wrote provider version to tmp/last-provider-version.txt (${providerVersion})`);
