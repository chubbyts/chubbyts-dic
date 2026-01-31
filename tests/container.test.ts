import { describe, expect, test } from 'vitest';
import { createTypedContainer, createTypedParameter } from '../src/container';

describe('createTypedContainer', () => {
  test('set with single service', () => {
    const service = { name: 'TestService', value: 42 };

    const container = createTypedContainer().factory('myService', () => service);

    expect(container.has('myService')).toBe(true);
    expect(container.has('unknown')).toBe(false);
    expect(container.get('myService')).toBe(service);
  });

  test('set with chained services and dependency injection', () => {
    class Config {
      readonly dbUrl = 'localhost:5432';
      readonly apiKey = 'secret';
    }

    class Database {
      constructor(public config: Config) {}
      connect() {
        return `Connected to ${this.config.dbUrl}`;
      }
    }

    class UserService {
      constructor(public db: Database) {}
      getUsers() {
        return ['user1', 'user2'];
      }
    }

    const container = createTypedContainer()
      .factory('config', () => new Config())
      .factory('database', (c) => new Database(c.get('config')))
      .factory('userService', (c) => new UserService(c.get('database')));

    expect(container.has('config')).toBe(true);
    expect(container.has('database')).toBe(true);
    expect(container.has('userService')).toBe(true);

    const config = container.get('config');
    expect(config).toBeInstanceOf(Config);
    expect(config.dbUrl).toBe('localhost:5432');

    const database = container.get('database');
    expect(database).toBeInstanceOf(Database);
    expect(database.connect()).toBe('Connected to localhost:5432');

    const userService = container.get('userService');
    expect(userService).toBeInstanceOf(UserService);
    expect(userService.getUsers()).toEqual(['user1', 'user2']);
  });

  test('sets with multiple services at once', () => {
    const container = createTypedContainer().factories({
      name: () => 'John',
      age: () => 30,
      active: () => true,
    });

    expect(container.get('name')).toBe('John');
    expect(container.get('age')).toBe(30);
    expect(container.get('active')).toBe(true);
  });

  test('set with replaced service', () => {
    const container = createTypedContainer()
      .factory('service', () => ({ key1: 'value1' }))
      .factory('service', () => ({ key2: 'value2' }));

    expect(container.get('service')).toMatchInlineSnapshot(`
        {
          "key2": "value2",
        }
      `);
  });

  test('set with extended service using existingFactory', () => {
    type ServiceType = { key1: string; key2?: string };

    const container = createTypedContainer()
      .factory('service', (): ServiceType => ({ key1: 'value1' }))
      .factory('service', (_c, existingFactory): ServiceType => {
        const existing: ServiceType = existingFactory ? existingFactory(_c) : { key1: '' };
        return {
          ...existing,
          key2: 'value2',
        };
      });

    const service1 = container.get('service');
    const service2 = container.get('service');

    // Same instance (singleton behavior)
    expect(service1).toBe(service2);

    expect(service1).toMatchInlineSnapshot(`
        {
          "key1": "value1",
          "key2": "value2",
        }
      `);
  });

  test('get caches service instances (singleton)', () => {
    // eslint-disable-next-line functional/no-let
    let callCount = 0;

    const container = createTypedContainer().factory('counter', () => {
      callCount++;
      return { count: callCount };
    });

    const first = container.get('counter');
    const second = container.get('counter');
    const third = container.get('counter');

    expect(first).toBe(second);
    expect(second).toBe(third);
    expect(callCount).toBe(1);
    expect(first.count).toBe(1);
  });

  test('get with unknown service throws error', () => {
    const container = createTypedContainer();

    expect(() => {
      (container as { get: (id: string) => unknown }).get('nonexistent');
    }).toThrow('There is no service with id "nonexistent"');
  });

  test('get with service that throws error wraps it', () => {
    const originalError = new Error('Factory failed');

    const container = createTypedContainer().factory('failing', () => {
      throw originalError;
    });

    try {
      container.get('failing');
      throw new Error('Expected error');
    } catch (e) {
      const { name, message, cause } = e as Error & { cause: Error };
      expect(name).toBe('Error');
      expect(message).toBe('Could not create service with id "failing"');
      expect(cause).toBe(originalError);
    }
  });

  test('service replacement clears cached instance', () => {
    // eslint-disable-next-line functional/no-let
    let version = 1;

    const container = createTypedContainer().factory('versioned', () => ({ version: version++ }));

    const first = container.get('versioned');
    expect(first.version).toBe(1);

    // Replace the service
    const updatedContainer = container.factory('versioned', () => ({ version: version++ }));

    const second = updatedContainer.get('versioned');
    expect(second.version).toBe(2);
  });

  describe('createTypedParameter', () => {
    test('returns typed constant value', () => {
      const stringParam = createTypedParameter('hello');
      const numberParam = createTypedParameter(42);
      const objectParam = createTypedParameter({ nested: { value: true } });

      expect(stringParam()).toBe('hello');
      expect(numberParam()).toBe(42);
      expect(objectParam()).toEqual({ nested: { value: true } });
    });

    test('works with typed container', () => {
      const container = createTypedContainer()
        .factory('apiUrl', createTypedParameter('https://api.example.com'))
        .factory('maxRetries', createTypedParameter(3))
        .factory('config', createTypedParameter({ debug: true, timeout: 5000 }));

      expect(container.get('apiUrl')).toBe('https://api.example.com');
      expect(container.get('maxRetries')).toBe(3);
      expect(container.get('config')).toEqual({ debug: true, timeout: 5000 });
    });
  });

  describe('type safety (compile-time checks)', () => {
    test('types are correctly inferred', () => {
      const container = createTypedContainer()
        .factory('str', () => 'hello')
        .factory('num', () => 123)
        .factory('obj', () => ({ foo: 'bar' }));

      // These assignments verify type inference at compile time
      const str: string = container.get('str');
      const num: number = container.get('num');
      const obj: { foo: string } = container.get('obj');

      expect(str).toBe('hello');
      expect(num).toBe(123);
      expect(obj).toEqual({ foo: 'bar' });
    });

    test('factory receives correctly typed container', () => {
      const container = createTypedContainer()
        .factory('base', () => 10)
        .factory('derived', (c) => {
          // c.get('base') should be typed as number
          const base: number = c.get('base');
          return base * 2;
        });

      expect(container.get('derived')).toBe(20);
    });
  });
});
