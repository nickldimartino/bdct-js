import { PactV3, MatchersV3 } from '@pact-foundation/pact';
const { like, integer, regex } = MatchersV3;

const consumerName = process.env.CONSUMER_NAME || 'BDCT-JS-Consumer';
const providerName = 'BDCT-JS-Provider';

const provider = new PactV3({ consumer: consumerName, provider: providerName });

describe('Bad contract demo (will be incompatible with provider OpenAPI)', () => {
  it('expects wrong types and an extra required field', async () => {
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
          id: integer(123),
          name: like('Alice'),
          email: regex('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', 'alice@example.com'),
          // ❌ Wrong: provider schema says boolean, we demand string
          active: like('true'),
          // ❌ Extra required property that provider schema does not define
          role: like('admin'),
        },
      });

    await provider.executeTest(async (mockUrl) => {
      const res = await fetch(`${mockUrl}/users/123`, { headers: { Accept: 'application/json' } });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.role).toBe('admin');
    });
  });
});
