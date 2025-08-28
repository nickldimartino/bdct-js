// scripts/publish-provider.cjs
require('dotenv').config({ path: '.env' });

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ------- helpers -------
function req(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

function guessContentType(p) {
  const ext = (p.split('.').pop() || '').toLowerCase();
  if (ext === 'json') return 'application/json';
  if (ext === 'yaml' || ext === 'yml') return 'application/yaml';
  return 'text/plain';
}

// ------- required env -------
const BROKER_BASE_URL = req('PACT_BROKER_BASE_URL');
const BROKER_TOKEN    = req('PACT_BROKER_TOKEN');

// ------- provider settings (with sensible defaults) -------
const PROVIDER_NAME   = process.env.PROVIDER_NAME || 'BDCT-JS-Provider';
const PROVIDER_CONTRACT =
  process.env.PROVIDER_CONTRACT || 'openapi/provider.generated.yaml';

const PROVIDER_VERSION =
  process.env.PROVIDER_VERSION ||
  process.env.GITHUB_SHA ||
  'local';

const PROVIDER_BRANCH =
  process.env.PROVIDER_BRANCH ||
  process.env.GITHUB_REF_NAME ||
  'main';

// ------- optional self-verification envs -------
const VERIFY_EXIT_CODE         = process.env.PROVIDER_VERIFY_EXIT_CODE; // e.g. "0" or "1"
const VERIFIER                 = process.env.PROVIDER_VERIFIER || '';   // e.g. "jest"
const VERIFIER_VERSION         = process.env.PROVIDER_VERIFIER_VERSION || ''; // e.g. "30.0.5"
let   VERIFY_RESULTS_PATH      = process.env.PROVIDER_VERIFY_RESULTS_PATH;    // optional path to a file
let   VERIFY_RESULTS_CT        = process.env.PROVIDER_VERIFY_RESULTS_CONTENT_TYPE; // optional override

// ensure tmp dir for any generated artifacts
fs.mkdirSync('tmp', { recursive: true });

// If an exit code is provided, we must include *both* content and contentType
// If the user hasn't supplied a results file, we create a tiny JSON summary.
if (VERIFY_EXIT_CODE !== undefined && !VERIFY_RESULTS_PATH) {
  VERIFY_RESULTS_PATH = path.join('tmp', 'self-verification.json');

  const payload = {
    summary: 'Provider self-verification summary',
    exitCode: Number(VERIFY_EXIT_CODE),
    verifier: VERIFIER || undefined,
    verifierVersion: VERIFIER_VERSION || undefined,
    // Nice-to-have link back to the CI run if present
    buildUrl:
      process.env.GITHUB_SERVER_URL &&
      process.env.GITHUB_REPOSITORY &&
      process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : undefined
  };

  fs.writeFileSync(VERIFY_RESULTS_PATH, JSON.stringify(payload, null, 2));
  VERIFY_RESULTS_CT = 'application/json';
}

// If user provided a results file but no content type, guess it
if (VERIFY_EXIT_CODE !== undefined && !VERIFY_RESULTS_CT && VERIFY_RESULTS_PATH) {
  VERIFY_RESULTS_CT = guessContentType(VERIFY_RESULTS_PATH);
}

// Build CLI args
const args = [
  '--no-install',
  'pactflow',
  'publish-provider-contract',
  // NOTE: for pactflow CLI the contract file is a positional argument
  PROVIDER_CONTRACT,
  '--provider', PROVIDER_NAME,
  '--provider-app-version', PROVIDER_VERSION,
  '--branch', PROVIDER_BRANCH,
  '--content-type', 'application/yaml',
  '--broker-base-url', BROKER_BASE_URL,
  '--broker-token', BROKER_TOKEN
];

// Add self-verification flags if requested
if (VERIFY_EXIT_CODE !== undefined) {
  args.push(
    '--verification-exit-code', String(VERIFY_EXIT_CODE)
  );
  if (VERIFY_RESULTS_PATH) {
    args.push('--verification-results', VERIFY_RESULTS_PATH);
  }
  if (VERIFY_RESULTS_CT) {
    args.push('--verification-results-content-type', VERIFY_RESULTS_CT);
  }
  if (VERIFIER) {
    args.push('--verifier', VERIFIER);
  }
  if (VERIFIER_VERSION) {
    args.push('--verifier-version', VERIFIER_VERSION);
  }
}

console.log('▶️  npx', args.join(' '));
const r = spawnSync('npx', args, { stdio: 'inherit', shell: true });
process.exit(r.status ?? 1);
