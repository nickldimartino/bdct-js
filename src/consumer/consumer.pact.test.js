/**
 * GOOD consumer contract:
 * - /users/123 returns a valid user
 * - /users/999 returns a structured 404
 * Mirrors the OpenAPI GOOD shape (active: boolean).
 */
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

// Define the consumer and provider names used in the contract
const consumerName = 'BDCT-JS-Consumer';
const providerName = 'BDCT-JS-Provider';

// Regex for validating email format in the mock response
const EMAIL_RE = '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$';

// Main test suite for the "GOOD" contract scenario
describe('Consumer ↔ Provider contract (GOOD)', () => {

  // First test case: the provider returns a valid user for /users/123
  it('GET /users/123 → 200 with a user', async () => {
    // Spin up a new Pact mock provider for this test
    const provider = new PactV3({
      consumer: consumerName,
      provider: providerName,
      dir: 'pacts',         // Pact files will be saved here
      logLevel: 'info',     // Logs helpful debug info
    });

    // Define the interaction: when user 123 exists, and the consumer requests it...
    provider
      .given('User with id 123 exists')
      .uponReceiving('a request for user 123 (good)')
      .withRequest({
        method: 'GET',
        path: '/users/123',
        headers: { Accept: 'application/json' },
      })
      // ...the provider should respond with a valid user payload
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          id: MatchersV3.integer(123),                               // Ensure id is an integer
          name: MatchersV3.string('Jane Doe'),                       // Ensure name is a string
          email: MatchersV3.regex(EMAIL_RE, 'jane.doe@example.com'), // Validate email format
          active: MatchersV3.boolean(true),                          // Active is a boolean
        },
      });

    // Execute the mock provider test and validate consumer expectations
    await provider.executeTest(async (mock) => {
      // Consumer makes the request against the mock server
      const res = await fetch(`${mock.url}/users/123`, {
        headers: { Accept: 'application/json' },
      });
      const body = await res.json();

      // Assertions: ensure response shape matches expectations
      expect(res.status).toBe(200);
      expect(typeof body.id).toBe('number');
      expect(typeof body.name).toBe('string');
      expect(typeof body.email).toBe('string');
      expect(typeof body.active).toBe('boolean');
    });
  });

  // Second test case: the provider returns a structured 404 when user is not found
  it('GET /users/999 → 404 not found', async () => {
    // Spin up another Pact mock provider instance
    const provider = new PactV3({
      consumer: consumerName,
      provider: providerName,
      dir: 'pacts',
      logLevel: 'info',
    });

    // Define the interaction: when user 999 does not exist...
    provider
      .given('User with id 999 does not exist')
      .uponReceiving('a request for user 999 (good)')
      .withRequest({
        method: 'GET',
        path: '/users/999',
        headers: { Accept: 'application/json' },
      })
      // ...the provider should return a 404 with a structured error
      .willRespondWith({
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: { error: MatchersV3.string('Not found') }, // Error message must be a string
      });

    // Execute the mock provider test and validate consumer expectations
    await provider.executeTest(async (mock) => {
      // Consumer makes the request
      const res = await fetch(`${mock.url}/users/999`, {
        headers: { Accept: 'application/json' },
      });
      const body = await res.json();

      // Assertions: ensure 404 is returned with an error field
      expect(res.status).toBe(404);
      expect(body.error).toBeDefined();
    });
  });
});
