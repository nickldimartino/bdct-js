// src/consumer/consumer.pact.mrde.test.js
// DEMO-ONLY: MRDE-style matcher coverage in a separate consumer/provider pair.
// Do NOT publish this in your BDCT pipeline unless you also have a matching provider.

import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const demo = new PactV3({
  consumer: 'BDCT-JS-Consumer-MRDE',
  provider: 'BDCT-JS-Provider-MRDE',
});

describe('MRDE Showcase (separate pact pair, demo only)', () => {
  it('GET /mrde-demo → 200 with lots of matcher types', async () => {
    demo
      .uponReceiving('MRDE matcher showcase')
      .withRequest({
        method: 'GET',
        path: '/mrde-demo',
        headers: {
          Accept: MatchersV3.regex(/^application\/json(;.*)?$/, 'application/json'),
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': MatchersV3.regex(
            /^application\/json(;.*)?$/,
            'application/json; charset=utf-8'
          ),
        },
        body: {
          // Basic types
          aString: MatchersV3.string('Alice'),            // MRDE ≈ matching(type,'Alice')
          anInt: MatchersV3.integer(42),                  // MRDE ≈ matching(integer,42)
          aDecimal: MatchersV3.decimal(3.14),             // MRDE ≈ matching(number,3.14)
          aBool: MatchersV3.boolean(true),                // MRDE ≈ matching(boolean,true)
          aNull: MatchersV3.nullValue(),                  // MRDE ≈ null()

          // Regex
          email: MatchersV3.regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'alice@example.com'),
          // MRDE ≈ matching(regex,'^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$','alice@example.com')

          // Date/Time
          dateOnly: MatchersV3.date('yyyy-MM-dd', '2025-08-28'),        // MRDE ≈ date('yyyy-MM-dd','2025-08-28')
          timeOnly: MatchersV3.time('HH:mm:ss', '13:45:00'),             // MRDE ≈ time('HH:mm:ss','13:45:00')
          timestamp: MatchersV3.timestamp('yyyy-MM-dd HH:mm:ss', '2025-08-28 13:45:00'),
          // MRDE ≈ timestamp('yyyy-MM-dd HH:mm:ss','2025-08-28 13:45:00')

          // UUID
          uuid: MatchersV3.uuid('3fa85f64-5717-4562-b3fc-2c963f66afa6'), // MRDE ≈ uuid('...')

          // Non-empty
          notEmpty: MatchersV3.notEmpty('non-empty'),    // MRDE ≈ notEmpty('non-empty')

          // Arrays
          roles: MatchersV3.eachLike(MatchersV3.string('user'), { min: 2 }),
          // MRDE ≈ eachLike(matching(type,'user'),2)

          // Nested objects
          profile: MatchersV3.like({
            id: MatchersV3.integer(1001),
            name: MatchersV3.string('Demo Name'),
            contact: {
              email: MatchersV3.regex(/.+@.+/, 'demo@example.com'),
              phone: MatchersV3.regex(/^\+?\d{10,15}$/, '+15551234567'),
            },
          }),
        },
      });

    await demo.executeTest(async (mockServer) => {
      const base = mockServer.url;
      const res = await fetch(`${base}/mrde-demo`, {
        headers: { Accept: 'application/json' },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(typeof body.aString).toBe('string');
      expect(typeof body.anInt).toBe('number');
      expect(typeof body.aDecimal).toBe('number');
      expect(typeof body.aBool).toBe('boolean');
      expect(body.aNull).toBeNull();
      expect(Array.isArray(body.roles)).toBe(true);
      expect(typeof body.profile?.id).toBe('number');
    });
  });
});
