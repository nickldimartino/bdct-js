/**
 * MRDE showcase — exercises a variety of matcher shapes on a separate endpoint.
 * Purpose: Show off Pact's "Matcher Rule Definition Expressions" (MRDE) style
 *          capabilities in a compact, demo-friendly way.
 */
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

describe('MRDE Showcase (separate pact pair, demo only)', () => {
  const pact = new PactV3({
    consumer: 'BDCT-JS-Consumer',
    provider: 'BDCT-JS-Provider',
  });

  // Short-hand aliases for matchers
  const like = MatchersV3.like;
  const regex = MatchersV3.regex;
  const integer = MatchersV3.integer;
  const boolean = MatchersV3.boolean;
  const string = MatchersV3.string;

  // Main MRDE demo endpoint
  it('GET /mrde-demo → 200 with lots of matcher types', async () => {
    // Define payload using many matcher shapes
    const payload = {
      id: integer(101),           // must be an integer
      ok: boolean(true),          // must be boolean
      name: string('Widget'),     // must be string

      // “non-empty string” simulated with regex (no notEmpty matcher in pact-js)
      notEmpty: regex(/^.+$/, 'non-empty'),

      // Array of roles → must contain at least 2 string items
      roles: MatchersV3.eachLike(string('user'), 2),

      // Nested object with constrained fields
      meta: like({
        tier: regex(/^(gold|silver)$/, 'gold'),       // must be "gold" or "silver"
        version: regex(/^\d+\.\d+\.\d+$/, '1.2.3'),   // must match semantic version
      }),
    };

    // Pact interaction definition for this endpoint
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

    // Execute test against the mock server
    await pact.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/mrde-demo`, {
        headers: { Accept: 'application/json' },
      });
      expect(res.status).toBe(200);
      const body = await res.json();

      // Runtime assertions to reinforce contract expectations
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
