#!/usr/bin/env node
// ^ Makes this script runnable directly as a CLI tool

require('dotenv').config({ path: '.env' }); // Load env vars from .env file

const { spawnSync } = require('child_process'); // Run external CLI commands
const fs = require('fs'); // File system utilities

// Helper to enforce required environment variables
function req(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

// ✅ Required environment variables
const brokerBaseUrl     = req('PACT_BROKER_BASE_URL'); // Pactflow base URL
const brokerToken       = req('PACT_BROKER_TOKEN');    // Auth token
const providerContract  = req('PROVIDER_CONTRACT');    // Path to provider OAS contract

// ⚙️ Optional environment variables with fallbacks
const providerBranch    = process.env.PROVIDER_BRANCH
                       || process.env.BRANCH
                       || process.env.GITHUB_REF_NAME
                       || 'main';

let   providerVersion   = process.env.PROVIDER_VERSION
                       || process.env.GITHUB_SHA
                       || Date.now().toString();

const verifier          = process.env.PROVIDER_VERIFIER || 'jest';
const verifierVersion   = process.env.PROVIDER_VERIFIER_VERSION || 'local';

// 🟢 Determine verification success
// If PROVIDER_VERIFY_EXIT_CODE is provided, use it (0 = success), else default success=true
const exitCodeRaw       = process.env.PROVIDER_VERIFY_EXIT_CODE;
const success           = (exitCodeRaw === undefined) ? true : String(exitCodeRaw) === '0';

// 📝 Build minimal self-verification payload
// Pactflow requires results file content to accompany the provider contract
fs.mkdirSync('tmp', { recursive: true });
const resultsPath = 'tmp/provider-self--verify.json';
const resultsBody = {
  success,
  verifier,
  verifierVersion,
  executedAt: new Date().toISOString(),
};
fs.writeFileSync(resultsPath, JSON.stringify(resultsBody, null, 2));

// 🛠️ Build arguments for Pactflow CLI command
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
  '--broker-token', brokerToken,
];

// ▶️ Execute the pactflow publish-provider-contract command
console.log('▶️  pactflow', args.join(' '));
const result = spawnSync('pactflow', args, { stdio: 'inherit', shell: true });

// ❌ Fail fast if the command didn’t succeed
if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);

// 📌 Persist provider version to file for later use
// This is useful for `can-i-deploy` and `record-deployment` steps
fs.writeFileSync('tmp/last-provider-version.txt', String(providerVersion));
console.log(`📝 Wrote provider version to tmp/last-provider-version.txt (${providerVersion})`);
