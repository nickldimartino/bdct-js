// src/consumer/consumer.pact.bad.test.js
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const consumerName = 'BDCT-JS-Consumer';
const providerName = 'BDCT-JS-Provider';
const EMAIL_RE = '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$';

describe('Bad contract demo', () => {
  it('expects wrong types and an extra field (will fail compatibility)', async () => {
    const provider = new PactV3({
      consumer: consumerName,
      provider: providerName,
      dir: 'pacts',
      logLevel: 'info',
    });

    provider
      .given('User with id 123 exists')
      .uponReceiving('a request for user 123 (bad)')
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
          name: MatchersV3.string('Alice'),
          email: MatchersV3.regex({ matcher: EMAIL_RE, generate: 'alice@example.com' }),
          // WRONG TYPE on purpose (provider returns boolean)
          active: MatchersV3.like('true'),
          // EXTRA required field that provider does not return
          mustHave: MatchersV3.string('THIS_FIELD_DOES_NOT_EXIST_IN_PROVIDER'),
        },
      });

    await provider.executeTest(async (mock) => {
      const res = await fetch(`${mock.url}/users/123`, {
        headers: { Accept: 'application/json' },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.active).toBe('true');
      expect(body.mustHave).toBeDefined();
    });
  });
});
