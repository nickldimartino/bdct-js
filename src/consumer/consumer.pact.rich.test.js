// src/consumer/consumer.pact.rich.test.js
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

describe('Consumer ↔ Provider contract (RICH)', () => {
  const pact = new PactV3({
    consumer: 'BDCT-JS-Consumer',
    provider: 'BDCT-JS-Provider',
  });

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

  it('GET /users/123 → 200 with a richly-described user', async () => {
    const richUser = {
      id: integer(123),
      name: string('Jane Doe'),
      email: regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'jane.doe@example.com'),
      active: boolean(true),
      balance: decimal(1234.56),
      createdAt: timestamp("yyyy-MM-dd'T'HH:mm:ssXXX", '2024-07-15T12:34:56+00:00'),
      birthday: date('yyyy-MM-dd', '1990-04-21'),
      preferredTime: time('HH:mm:ss', '09:30:00'),
      userId: uuid('3fa85f64-5717-4562-b3fc-2c963f66afa6'),
      address: like({
        line1: string('1 Main St'),
        city: string('Springfield'),
        zip: regex(/^\d{5}(-\d{4})?$/, '12345'),
      }),
      // Use numeric overload to avoid RangeError
      roles: MatchersV3.eachLike(string('user'), 2),
      tags: MatchersV3.eachLike(regex(/^[a-z0-9-]+$/, 'alpha'), 1),
      // demo of nullable (example value null)
      nickname: like(null),
    };

    pact
      .uponReceiving('GET user 123 with rich matchers')
      .withRequest({
        method: 'GET',
        path: '/users/123',
        headers: {
          // match request Accept header with regex
          Accept: regex(/^application\/json(?:;.*)?$/, 'application/json'),
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          // IMPORTANT: response content-type must be a literal (no matcher)
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: richUser,
      });

    await pact.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/users/123`, {
        headers: { Accept: 'application/json' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(typeof body.id).toBe('number');
      expect(typeof body.name).toBe('string');
      expect(typeof body.email).toBe('string');
      expect(typeof body.active).toBe('boolean');
      expect(Array.isArray(body.roles)).toBe(true);
    });
  });

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
          error: string('Not found'),
          // MRDE-like “not empty” via regex
          requestId: regex(/^.+$/, 'req-123'),
        },
      });

    await pact.executeTest(async (mockServer) => {
      const res = await fetch(`${mockServer.url}/users/999`, {
        headers: { Accept: 'application/json' },
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(typeof body.error).toBe('string');
      expect(typeof body.requestId).toBe('string');
      expect(body.requestId.length).toBeGreaterThan(0);
    });
  });
});
