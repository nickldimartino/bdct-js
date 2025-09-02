import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { expect } from 'chai';
import { ExampleClient } from './ExampleClient'; // Assume this is your client to make HTTP requests

const { like, integer, boolean, string } = MatchersV3;

describe('Consumer Pact with User Service', () => {
  const provider = new PactV3({
    consumer: 'MyConsumer',
    provider: 'UserService',
  });

  describe('Pact for GET /users/{id}', () => {
    it('returns a user by id', () => {
      provider
        .given('a user with id 123 exists')
        .uponReceiving('a request to get a user by id')
        .withRequest({
          method: 'GET',
          path: '/users/123',
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: integer(123),
            name: string('Jane Doe'),
            email: string('jane.doe@example.com'),
            active: boolean(true),
          },
        });

      return provider.executeTest(async (mockserver) => {
        const client = new ExampleClient(mockserver.url);
        const response = await client.getUserById(123);
        expect(response).to.deep.equal({
          id: 123,
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          active: true,
        });
      });
    });
  });
});