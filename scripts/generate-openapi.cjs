const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const swaggerJsdoc = require('swagger-jsdoc');

// Toggle flag: DEMO_BAD=true → intentionally mutate spec to cause mismatch
const isBad = /^true$/i.test(process.env.DEMO_BAD || '');

// --------------------------
// Swagger-jsdoc configuration
// --------------------------
const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BDCT-JS Provider',
      version: '1.0.0',
      description:
        'OpenAPI generated from JSDoc for Bi-Directional Contract Testing demos.',
    },
  },
  // Where swagger-jsdoc should look for JSDoc comments
  apis: [path.resolve(__dirname, '..', 'src', 'provider', '**/*.js')],
};

// Generate the OpenAPI specification from JSDoc comments
let spec = swaggerJsdoc(options);

// --------------------------
// BAD demo mutation (optional)
// --------------------------
// If DEMO_BAD is set, alter the schema to break compatibility with consumers
if (isBad) {
  try {
    const u = spec.components.schemas.User;
    if (u && u.properties && u.properties.active) {
      // Change "active" from boolean → string
      u.properties.active.type = 'string'; // mismatch with consumer contract
      spec.info.title += ' (BAD DEMO)';
      spec.info.description +=
        '\n\nNOTE: This spec was intentionally mutated for a failure demo.';
    }
  } catch (e) {
    console.warn('Could not apply BAD mutation:', e);
  }
}

// --------------------------
// Write OpenAPI file to disk
// --------------------------
const outDir = path.resolve(__dirname, '..', 'openapi');
const outFile = path.join(outDir, 'provider.generated.yaml');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, YAML.stringify(spec), 'utf8');

// Print confirmation
console.log(
  `✅ OpenAPI written to ${outFile} ${isBad ? '(BAD demo)' : '(GOOD demo)'}`
);
