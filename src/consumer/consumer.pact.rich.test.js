/**
 * RICH demo — shows off many matcher types on the "good" path.
 * This example demonstrates Pact’s flexibility in describing complex payloads
 * using a wide variety of matcher types (string, regex, date, time, uuid, etc.).
 */
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

// Define a new Pact test suite for the "RICH" contract example
describe('Consumer ↔ Provider contract (RICH)', () => {
  const pact = new PactV3({
    consumer: 'BDCT-JS-Consumer',
    provider: 'BDCT-JS-Provider',
  });

  // Pull matcher helpers into shorter variables for readability
  const like = MatchersV3.like;
  const regex = MatchersV3.regex;
  const integer = MatchersV3.integer;
  const decimal = MatchersV3.decimal;
  const boolean = MatchersV3.boolean;
  const string = MatchersV3.string;
  const timestamp = MatchersV3.timestamp;
  const date = MatchersV3.date;
  const time = MatchersV3.time;
  const uuid = MatchersV3.uuid;

  // First test case: a richly described successful user response
  it('GET /users/123 → 200 with a richly-described user', async () => {
    // Construct a payload that demonstrates many different matcher types
    const richUser = {
      id: integer(123),  // must be integer
      name: string('Jane Doe'),  // must be string
      email: regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'jane.doe@example.com'), // must match email pattern
      active: boolean(true), // must be boolean
      balance: decimal(1234.56), // must be decimal
      createdAt: timestamp("yyyy-MM-dd'T'HH:mm:ssXXX", '2024-07-15T12:34:56+00:00'), // ISO timestamp
      birthday: date('yyyy-MM-dd', '1990-04-21'), // date format
      preferredTime: time('HH:mm:ss', '09:30:00'), // time format
      userId: uuid('3fa85f64-5717-4562-b3fc-2c963f66afa6'), // valid UUID
      address: like({  // nested object matcher
        line1: string('1 Main St'),
        city: string('Springfield'),
        zip: regex(/^\d{5}(-\d{4})?$/, '12345'), // US ZIP code
      }),
      roles: MatchersV3.eachLike(string('user'), 2), // array with at least 2 items, each a string
      tags: MatchersV3.eachLike(regex(/^[a-z0-9-]+$/, 'alpha'), 1), // array with regex-constrained strings
      nickname: like(null), // nullable field demo
    };

    // Define Pact interaction for the success case
    pact
      .uponReceiving('GET user 123 with rich matchers')
      .withRequest({
        method: 'GET',
        path: '/users/123',
        headers: {
          // Request Accept header must match regex (e.g. "application/json")
          Accept: regex(/^application\/json(?:;.*)?$/, 'application/json'),
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          // Response Content-Type must be literal (cannot be a matcher)
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: richUser, // The body includes all matcher examples
      });

    // Execute the consumer test against the mock server
    await pact.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/users/123`, {
        headers: { Accept: 'application/json' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();

      // Basic runtime assertions (beyond what Pact enforces)
      expect(typeof body.id).toBe('number');
      expect(typeof body.name).toBe('string');
      expect(typeof body.email).toBe('string');
      expect(typeof body.active).toBe('boolean');
      expect(Array.isArray(body.roles)).toBe(true);
    });
  });

  // Second test case: error response for a missing user
  it('GET /users/999 → 404 with error payload', async () => {
    pact
      .uponReceiving('GET user 999 returns 404 with error')
      .withRequest({
        method: 'GET',
        path: '/users/999',
        headers: {
          Accept: regex(/^application\/json(?:;.*)?$/, 'application/json'),
        },
      })
      .willRespondWith({
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          error: string('Not found'), // error field must be string
          requestId: regex(/^.+$/, 'req-123'), // must be non-empty string
        },
      });

    await pact.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/users/999`, {
        headers: { Accept: 'application/json' },
      });
      expect(res.status).toBe(404);
      const body = await res.json();

      // Runtime assertions on the error payload
      expect(typeof body.error).toBe('string');
      expect(typeof body.requestId).toBe('string');
      expect(body.requestId.length).toBeGreaterThan(0);
    });
  });
});
