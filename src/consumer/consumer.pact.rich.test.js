// src/consumer/consumer.pact.rich.test.js
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const provider = new PactV3({
  consumer: 'BDCT-JS-Consumer',     // same pair as your BDCT flow
  provider: 'BDCT-JS-Provider',
});

describe('Consumer ↔ Provider contract (RICH MATCHERS, safe for BDCT)', () => {
  describe('GET /users/123 → 200 with a user', () => {
    it('returns user with strict types & header matchers', async () => {
      provider
        .uponReceiving('a request for user 123 (rich)')
        .given('User with id 123 exists')
        .withRequest({
          method: 'GET',
          path: '/users/123',
          headers: {
            // request header matcher (regex, concrete generated value)
            Accept: MatchersV3.regex(/^application\/json(;.*)?$/, 'application/json'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            // response header matcher
            'Content-Type': MatchersV3.regex(
              /^application\/json(;.*)?$/,
              'application/json; charset=utf-8'
            ),
          },
          body: {
            // exact types
            id: MatchersV3.integer(123), // MRDE ≈ matching(integer, 123)
            name: MatchersV3.string('Jane Doe'), // MRDE ≈ matching(type, 'Jane Doe')
            email: MatchersV3.regex(
              /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
              'jane.doe@example.com'
            ), // MRDE ≈ matching(regex, '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', 'jane.doe@example.com')
            active: MatchersV3.boolean(true), // MRDE ≈ matching(boolean, true)

            // showcase date/time matchers (schema-compatible examples)
            createdAt: MatchersV3.timestamp(
              'yyyy-MM-dd\'T\'HH:mm:ssXXX',
              '2025-08-28T12:00:00Z'
            ), // MRDE ≈ timestamp('yyyy-MM-dd\'T\'HH:mm:ssXXX','2025-08-28T12:00:00Z')

            // arrays with minimum lengths using eachLike(..., { min })
            tags: MatchersV3.eachLike(MatchersV3.string('demo'), { min: 2 }), // MRDE ≈ eachLike(matching(type,'demo'),2)

            // uuid matcher
            correlationId: MatchersV3.uuid('3fa85f64-5717-4562-b3fc-2c963f66afa6'), // MRDE ≈ uuid('3fa85f64-...')
          },
        });

      await provider.executeTest(async (mockServer) => {
        const base = mockServer.url;
        const res = await fetch(`${base}/users/123`, {
          headers: { Accept: 'application/json' },
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(typeof body.id).toBe('number');
        expect(typeof body.name).toBe('string');
        expect(typeof body.email).toBe('string'); // provider returns a string
        expect(typeof body.active).toBe('boolean');
        expect(Array.isArray(body.tags)).toBe(true);
        expect(typeof body.correlationId).toBe('string');
      });
    });
  });

  describe('GET /users/999 → 404 not found (rich headers)', () => {
    it('returns 404 with error body', async () => {
      provider
        .uponReceiving('a request for user 999 (rich)')
        .given('User with id 999 does not exist')
        .withRequest({
          method: 'GET',
          path: '/users/999',
          headers: { Accept: MatchersV3.regex(/^application\/json(;.*)?$/, 'application/json') },
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': MatchersV3.regex(
              /^application\/json(;.*)?$/,
              'application/json; charset=utf-8'
            ),
          },
          body: {
            error: MatchersV3.string('Not found'), // MRDE ≈ matching(type,'Not found')
          },
        });

      await provider.executeTest(async (mockServer) => {
        const base = mockServer.url;
        const res = await fetch(`${base}/users/999`, {
          headers: { Accept: 'application/json' },
        });
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(typeof body.error).toBe('string');
      });
    });
  });
});
