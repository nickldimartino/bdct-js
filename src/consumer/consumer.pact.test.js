// src/consumer/consumer.pact.test.js
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const consumerName = 'BDCT-JS-Consumer';
const providerName = 'BDCT-JS-Provider';
const EMAIL_RE = '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$';

describe('Consumer ↔ Provider contract (GOOD)', () => {
  it('GET /users/123 → 200 with a user', async () => {
    const provider = new PactV3({
      consumer: consumerName,
      provider: providerName,
      dir: 'pacts',
      logLevel: 'info',
    });

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
          id: MatchersV3.integer(123),
          name: MatchersV3.string('Jane Doe'),
          email: MatchersV3.regex(EMAIL_RE, 'jane.doe@example.com'),
          active: MatchersV3.boolean(true),
        },
      });

    await provider.executeTest(async (mock) => {
      const res = await fetch(`${mock.url}/users/123`, {
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

  it('GET /users/999 → 404 not found', async () => {
    const provider = new PactV3({
      consumer: consumerName,
      provider: providerName,
      dir: 'pacts',
      logLevel: 'info',
    });

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
        body: { error: MatchersV3.string('Not found') },
      });

    await provider.executeTest(async (mock) => {
      const res = await fetch(`${mock.url}/users/999`, {
        headers: { Accept: 'application/json' },
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBeDefined();
    });
  });
});
