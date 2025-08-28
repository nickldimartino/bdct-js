// src/consumer/consumer.pact.test.js
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const consumerName = 'BDCT-JS-Consumer';
const providerName = 'BDCT-JS-Provider';

// Email regex (simple)
const EMAIL_RE = '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$';

describe('Consumer ↔ Provider contract (GOOD)', () => {
  const provider = new PactV3({
    consumer: consumerName,
    provider: providerName,
    dir: 'pacts', // published by your scripts
    logLevel: 'info',
  });

  describe('GET /users/123 → 200 with a user', () => {
    provider
      .given('User with id 123 exists')
      .uponReceiving('a request for user 123 (good)')
      .withRequest({
        method: 'GET',
        path: '/users/123',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          // exact fields your provider contract has, with “deep” matchers:
          id: MatchersV3.integer(123),
          name: MatchersV3.string('Jane Doe'),
          email: MatchersV3.regex({
            generate: 'jane.doe@example.com',
            matcher: EMAIL_RE,
          }),
          active: MatchersV3.boolean(true),
        },
      });

    it('returns the user payload with valid types', async () => {
      await provider.executeTest(async (mockUrl) => {
        const res = await fetch(`${mockUrl}/users/123`, {
          headers: { Accept: 'application/json' },
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(typeof body.id).toBe('number');
        expect(typeof body.name).toBe('string');
        expect(typeof body.email).toBe('string');
        expect(typeof body.active).toBe('boolean');
      });
    });
  });

  describe('GET /users/999 → 404 not found', () => {
    provider
      .given('User with id 999 does not exist')
      .uponReceiving('a request for user 999 (good)')
      .withRequest({
        method: 'GET',
        path: '/users/999',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          // minimal error body (keeps compatibility with your provider)
          error: MatchersV3.string('Not found'),
        },
      });

    it('returns 404 with an error message', async () => {
      await provider.executeTest(async (mockUrl) => {
        const res = await fetch(`${mockUrl}/users/999`, {
          headers: { Accept: 'application/json' },
        });
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(body.error).toBeDefined();
      });
    });
  });
});
