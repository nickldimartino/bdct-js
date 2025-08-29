// src/consumer/consumer.pact.mrde.test.js
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

describe('MRDE Showcase (separate pact pair, demo only)', () => {
  const pact = new PactV3({
    consumer: 'BDCT-JS-Consumer',
    provider: 'BDCT-JS-Provider',
  });

  const like = MatchersV3.like;
  const regex = MatchersV3.regex;
  const integer = MatchersV3.integer;
  const boolean = MatchersV3.boolean;
  const string = MatchersV3.string;

  it('GET /mrde-demo → 200 with lots of matcher types', async () => {
    const payload = {
      id: integer(101),
      ok: boolean(true),
      name: string('Widget'),
      // “non-empty” using regex (no MatchersV3.notEmpty in pact-js)
      notEmpty: regex(/^.+$/, 'non-empty'),

      // Use numeric overload to avoid RangeError
      roles: MatchersV3.eachLike(string('user'), 2),

      meta: like({
        tier: regex(/^(gold|silver)$/, 'gold'),
        version: regex(/^\d+\.\d+\.\d+$/, '1.2.3'),
      }),
    };

    pact
      .uponReceiving('MRDE-ish payload with broad matcher coverage')
      .withRequest({
        method: 'GET',
        path: '/mrde-demo',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: payload,
      });

    await pact.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/mrde-demo`, {
        headers: { Accept: 'application/json' },
      });
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(typeof body.id).toBe('number');
      expect(typeof body.ok).toBe('boolean');
      expect(typeof body.name).toBe('string');
      expect(typeof body.notEmpty).toBe('string');
      expect(Array.isArray(body.roles)).toBe(true);
      expect(body.roles.length).toBeGreaterThanOrEqual(2);
      expect(typeof body.meta.tier).toBe('string');
      expect(typeof body.meta.version).toBe('string');
    });
  });
});
