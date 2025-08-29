// scripts/publish-consumer.cjs
require('dotenv').config({ path: '.env' });
const { spawnSync } = require('child_process');
const fs = require('fs');

function req(name) {
  const v = process.env[name];
  if (!v) { console.error(`❌ Missing env: ${name}`); process.exit(1); }
  return v;
}

const brokerBaseUrl = req('PACT_BROKER_BASE_URL');
const brokerToken   = req('PACT_BROKER_TOKEN');

const branch = process.env.BRANCH || process.env.GITHUB_REF_NAME || 'main';

// base version: explicit > git sha > timestamp
let baseVersion = process.env.CONSUMER_VERSION;
if (!baseVersion || baseVersion.toLowerCase() === 'local') {
  try {
    const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
    if (r.status === 0) baseVersion = r.stdout.trim();
  } catch {}
}
if (!baseVersion) baseVersion = String(Date.now());

// salt logic: if a suffix is provided OR branch != main, append a stable suffix + timestamp
const suffixEnv = process.env.CONSUMER_VERSION_SUFFIX || '';
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

let consumerVersion = baseVersion;
if (suffixEnv) {
  consumerVersion = `${baseVersion}-${suffixEnv}-${stamp}`;
} else if (branch !== 'main') {
  consumerVersion = `${baseVersion}-${branch}-${stamp}`;
}

const args = [
  'publish', './pacts',
  '--branch', branch,
  '--tag', branch,
  '--consumer-app-version', consumerVersion,
  '--broker-base-url', brokerBaseUrl,
  '--broker-token', brokerToken
];

console.log('▶️  pact-broker', args.join(' '));
const env = { ...process.env };
if (env.PACT_BROKER_DISABLE_SSL_VERIFICATION === 'true' || env.PACT_INSECURE_TLS === 'true') {
  env.PACT_BROKER_DISABLE_SSL_VERIFICATION = 'true';
}

const result = spawnSync('pact-broker', args, { stdio: 'inherit', shell: true, env });

// record the version for can-i-deploy:consumer
if ((result.status ?? 1) === 0) {
  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/last-consumer-version.txt', consumerVersion.trim());
  console.log(`📝 Wrote consumer version to tmp/last-consumer-version.txt (${consumerVersion})`);
}

process.exit(result.status ?? 1);
