require('dotenv').config({ path: '.env' }); // Load env vars from .env file
const { spawnSync } = require('child_process'); // To run shell commands
const fs = require('fs'); // To persist versions for downstream steps

// Helper: require a mandatory environment variable
function req(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

// Required env values
const brokerBaseUrl = req('PACT_BROKER_BASE_URL'); // Pact Broker or Pactflow URL
const brokerToken   = req('PACT_BROKER_TOKEN');    // Auth token

// Determine branch: explicit > GitHub env > fallback to "main"
const branch = process.env.BRANCH || process.env.GITHUB_REF_NAME || 'main';

// --------------------------
// Build a consumer version
// --------------------------
// Priority: explicit > Git SHA > timestamp
let baseVersion = process.env.CONSUMER_VERSION;
if (!baseVersion || baseVersion.toLowerCase() === 'local') {
  try {
    // Try using the Git short SHA
    const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
    if (r.status === 0) baseVersion = r.stdout.trim();
  } catch {}
}
if (!baseVersion) baseVersion = String(Date.now()); // fallback timestamp

// Add suffix or branch info to avoid collisions in non-main branches
const suffixEnv = process.env.CONSUMER_VERSION_SUFFIX || '';
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

let consumerVersion = baseVersion;
if (suffixEnv) {
  // Explicit suffix provided: include it plus timestamp
  consumerVersion = `${baseVersion}-${suffixEnv}-${stamp}`;
} else if (branch !== 'main') {
  // Non-main branch: include branch + timestamp
  consumerVersion = `${baseVersion}-${branch}-${stamp}`;
}

// --------------------------
// Build pact-broker CLI args
// --------------------------
const args = [
  'publish', './pacts', // publish all pact files in ./pacts
  '--branch', branch,
  '--tag', branch, // tag matches branch
  '--consumer-app-version', consumerVersion,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken,
];

// Print the command for visibility
console.log('▶️  pact-broker', args.join(' '));

// Allow disabling SSL verification if env flags set
const env = { ...process.env };
if (env.PACT_BROKER_DISABLE_SSL_VERIFICATION === 'true' || env.PACT_INSECURE_TLS === 'true') {
  env.PACT_BROKER_DISABLE_SSL_VERIFICATION = 'true';
}

// Execute pact-broker CLI synchronously
const result = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true, env });

// If successful, save consumer version for downstream (e.g., can-i-deploy checks)
if ((result.status ?? 1) === 0) {
  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/last-consumer-version.txt', consumerVersion.trim());
  console.log(`📝 Wrote consumer version to tmp/last-consumer-version.txt (${consumerVersion})`);
}

// Exit with same status as pact-broker CLI
process.exit(result.status ?? 1);
