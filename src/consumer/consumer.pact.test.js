import { PactV3, MatchersV3 } from '@pact-foundation/pact';
const { like, integer, boolean, regex } = MatchersV3;

const consumerName = process.env.CONSUMER_NAME || 'BDCT-JS-Consumer';
const providerName = 'BDCT-JS-Provider';

const provider = new PactV3({ consumer: consumerName, provider: providerName });

describe('Consumer ↔ Provider contract (GOOD)', () => {
  it('GET /users/123 → 200 with a user', async () => {
    provider
      .given('User with id 123 exists')
      .uponReceiving('a request for user 123')
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
          name: like('Jane Doe'),
          email: regex('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', 'jane.doe@example.com'),
          active: boolean(true),
        },
      });

    await provider.executeTest(async (mockUrl) => {
      const res = await fetch(`${mockUrl}/users/123`, { headers: { Accept: 'application/json' } });
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.name).toBeDefined();
    });
  });

  it('GET /users/999 → 404 not found', async () => {
    provider
      .given('User with id 999 does not exist')
      .uponReceiving('a request for user 999')
      .withRequest({
        method: 'GET',
        path: '/users/999',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: { error: like('Not found') },
      });

    await provider.executeTest(async (mockUrl) => {
      const res = await fetch(`${mockUrl}/users/999`, { headers: { Accept: 'application/json' } });
      const body = await res.json();
      expect(res.status).toBe(404);
      expect(body.error).toBe('Not found');
    });
  });
});
