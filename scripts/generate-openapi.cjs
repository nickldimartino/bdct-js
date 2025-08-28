// scripts/generate-openapi.cjs
/* Generates openapi/provider.generated.yaml from JSDoc in src/provider/*.js
   DEMO_BAD=true will mutate the schema to intentionally conflict with the consumer. */

const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const swaggerJsdoc = require('swagger-jsdoc');

const isBad = /^true$/i.test(process.env.DEMO_BAD || '');

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
  // JSDoc sources
  apis: [path.resolve(__dirname, '..', 'src', 'provider', '**/*.js')],
};

let spec = swaggerJsdoc(options);

// For the “bad” demo, mutate a field type to string to contradict consumer expectations
if (isBad) {
  try {
    const u = spec.components.schemas.User;
    if (u && u.properties && u.properties.active) {
      u.properties.active.type = 'string'; // consumer expects boolean
      spec.info.title += ' (BAD DEMO)';
      spec.info.description +=
        '\n\nNOTE: This spec was intentionally mutated for a failure demo.';
    }
  } catch (e) {
    console.warn('Could not apply BAD mutation:', e);
  }
}

const outDir = path.resolve(__dirname, '..', 'openapi');
const outFile = path.join(outDir, 'provider.generated.yaml');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, YAML.stringify(spec), 'utf8');

console.log(
  `✅ OpenAPI written to ${outFile} ${isBad ? '(BAD demo)' : '(GOOD demo)'}`
);
