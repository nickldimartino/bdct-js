/**
 * BAD consumer contract:
 * - Uses the same /users/123 path, but intentionally expects wrong types
 *   (e.g., `active` as a string instead of boolean).
 * - Also requires an extra field that the provider does not supply.
 * - This mismatch demonstrates BDCT incompatibility and will cause a failing
 *   `can-i-deploy` check when compared against the real provider implementation.
 */
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

// Define consumer and provider names (same as the GOOD contract)
const consumerName = 'BDCT-JS-Consumer';
const providerName = 'BDCT-JS-Provider';

// Regex for validating email format in mock responses
const EMAIL_RE = '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$';

// Test suite for the intentionally bad contract
describe('Bad contract demo', () => {
  it('expects wrong types and an extra field (will fail compatibility)', async () => {
    // Create a new Pact mock provider
    const provider = new PactV3({
      consumer: consumerName,
      provider: providerName,
      dir: 'pacts',     // Pact contract files are saved here
      logLevel: 'info',
    });

    // Define the interaction: request for /users/123 (same as GOOD)
    provider
      .given('User with id 123 exists')
      .uponReceiving('a request for user 123 (bad)')
      .withRequest({
        method: 'GET',
        path: '/users/123',
        headers: { Accept: 'application/json' },
      })
      // Define the WRONG expected response to force mismatch
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          id: MatchersV3.integer(123),                         // OK
          name: MatchersV3.string('Alice'),                    // OK
          email: MatchersV3.regex(EMAIL_RE, 'alice@example.com'), // OK
          // WRONG TYPE on purpose → expects string instead of boolean
          active: MatchersV3.like('true'),
          // EXTRA required field that provider will never return
          mustHave: MatchersV3.string('THIS_FIELD_DOES_NOT_EXIST_IN_PROVIDER'),
        },
      });

    // Execute test against the mock provider
    await provider.executeTest(async (mock) => {
      // Consumer makes the request against the mock service
      const res = await fetch(`${mock.url}/users/123`, {
        headers: { Accept: 'application/json' },
      });
      const body = await res.json();

      // Assertions → these will pass locally against the mock,
      // but will FAIL in BDCT because the real provider won’t match this shape
      expect(res.status).toBe(200);
      expect(body.active).toBe('true');        // Provider returns boolean, not string
      expect(body.mustHave).toBeDefined();     // Provider never sends this field
    });
  });
});
