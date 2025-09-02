// Load environment variables from .env file (convenient for local/dev use)
require('dotenv').config({ path: '.env' });

const { spawnSync } = require('child_process'); // Used to run shell commands
const fs = require('fs'); // Used to read files

// Helper function to require an environment variable
function req(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Missing env: ${name}`);
    process.exit(1); // Exit with failure if missing
  }
  return v;
}

// Mandatory environment variables (all required)
const brokerBaseUrl = req('PACT_BROKER_BASE_URL'); // URL of the Pact Broker
const brokerToken   = req('PACT_BROKER_TOKEN');    // Auth token for broker
const environment   = req('ENVIRONMENT');          // Environment name (e.g., dev, staging, prod)
const pacticipant   = process.env.PACTICIPANT || 'BDCT-JS-Provider'; 
// The service name being deployed (defaults to provider if not given)

// Deployment version can come from VERSION or VERSION_FILE
let version = process.env.VERSION;
const versionFile = process.env.VERSION_FILE;

// If VERSION not set, try reading from VERSION_FILE
if (!version && versionFile) {
  try {
    version = fs.readFileSync(versionFile, 'utf8').trim();
  } catch (e) {
    console.error(`❌ Failed to read VERSION_FILE: ${versionFile}`);
    process.exit(1);
  }
}

// Still no version? Fail fast.
if (!version) {
  console.error('❌ No VERSION provided and VERSION_FILE not found.');
  process.exit(1);
}

// Build CLI args for the pact-broker command
const args = [
  'record-deployment',
  '--pacticipant', pacticipant,
  '--version', version,
  '--environment', environment,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken,
];

// Print what will be run for visibility/logging
console.log('▶️  pact-broker', args.join(' '));

// Run the pact-broker CLI command synchronously
const result = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true });

// Exit the script with the same status as the pact-broker command
process.exit(result.status ?? 1);
