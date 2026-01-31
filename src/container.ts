/**
 * A registry mapping service IDs to their types.
 * This is built up through the fluent builder API.
 */
export type ServiceRegistry = Record<string, unknown>;

/**
 * Type-safe factory function that receives a typed container.
 */
export type TypedFactory<TRegistry extends ServiceRegistry, T> = (
  container: TypedContainer<TRegistry>,
  existingFactory?: TypedFactory<TRegistry, T>,
) => T;

/**
 * Type-safe container interface with compile-time checked get/has methods.
 */
export type TypedContainer<TRegistry extends ServiceRegistry> = {
  /**
   * Get a service by its ID. The return type is inferred from the registry.
   */
  get<K extends keyof TRegistry>(id: K): TRegistry[K];

  /**
   * Check if a service exists in the container.
   */
  has(id: string): boolean;
};

/**
 * Mutable container that allows registering new services.
 * Each registration returns a new type with the updated registry.
 */
export type TypedContainerBuilder<TRegistry extends ServiceRegistry> = TypedContainer<TRegistry> & {
  /**
   * Register a single service. Returns a new container type with the service added to the registry.
   * The factory receives the current registry (TRegistry) and can access previously registered services.
   */
  factory<K extends string, T>(
    id: K,
    factory: TypedFactory<TRegistry, T>,
  ): TypedContainerBuilder<TRegistry & Record<K, T>>;

  /**
   * Register multiple services at once.
   * All factories in the batch can access services from TRegistry (prior registrations).
   */
  factories<TNewServices extends ServiceRegistry>(factories: {
    [K in keyof TNewServices]: TypedFactory<TRegistry, TNewServices[K]>;
  }): TypedContainerBuilder<TRegistry & TNewServices>;
};

// Internal types for implementation
type AnyFactory = (container: TypedContainer<ServiceRegistry>, existingFactory?: AnyFactory) => unknown;

/**
 * Creates a type-safe dependency injection container.
 *
 * @example
 * ```typescript
 * class UserService {
 *   constructor(public config: Config) {}
 * }
 *
 * class Config {
 *   dbUrl = 'localhost';
 * }
 *
 * const container = createTypedContainer()
 *   .factory('config', () => new Config())
 *   .factory('userService', (c) => new UserService(c.get('config')));
 *
 * // Type-safe: userService is inferred as UserService
 * const userService = container.get('userService');
 *
 * // Compile error: 'unknown' is not a valid key
 * // container.get('unknown');
 *
 * // Compile error: wrong type
 * // const num: number = container.get('config');
 * ```
 */
export const createTypedContainer = (): TypedContainerBuilder<Record<string, never>> => {
  const storedFactories = new Map<string, AnyFactory>();
  const storedServices = new Map<string, unknown>();

  const create = (id: string): unknown => {
    const factoryById = storedFactories.get(id);

    if (!factoryById) {
      throw new Error(`There is no service with id "${id}"`);
    }

    try {
      return factoryById(container as unknown as TypedContainer<ServiceRegistry>);
    } catch (e) {
      const error: Error & { cause?: unknown } = new Error(`Could not create service with id "${id}"`);
      // eslint-disable-next-line functional/immutable-data
      error.cause = e;
      throw error;
    }
  };

  const createWrapperFactory = (newFactory: AnyFactory, existingFactory?: AnyFactory): AnyFactory => {
    return (c: TypedContainer<ServiceRegistry>): unknown => newFactory(c, existingFactory);
  };

  // The implementation uses `any` internally but the public API is fully typed.
  // This is a common pattern for builder APIs where the type changes with each call.
  const container = {
    factory(id: string, factory: AnyFactory): unknown {
      // eslint-disable-next-line functional/immutable-data
      storedServices.delete(id);
      const existingFactory = storedFactories.get(id);
      // eslint-disable-next-line functional/immutable-data
      storedFactories.set(id, createWrapperFactory(factory, existingFactory));
      return container;
    },

    factories(factories: Record<string, AnyFactory>): unknown {
      for (const [id, factory] of Object.entries(factories)) {
        container.factory(id, factory);
      }
      return container;
    },

    get(id: string): unknown {
      if (!storedServices.has(id)) {
        // eslint-disable-next-line functional/immutable-data
        storedServices.set(id, create(id));
      }
      return storedServices.get(id);
    },

    has(id: string): boolean {
      return storedFactories.has(id);
    },
  };

  return container as unknown as TypedContainerBuilder<Record<string, never>>;
};

/**
 * Creates a type-safe parameter factory that returns a constant value.
 *
 * @example
 * ```typescript
 * const container = createTypedContainer()
 *   .factory('apiUrl', createTypedParameter('https://api.example.com'))
 *   .factory('maxRetries', createTypedParameter(3));
 *
 * const url = container.get('apiUrl'); // Type: string
 * const retries = container.get('maxRetries'); // Type: number
 * ```
 */
export const createTypedParameter = <T>(value: T): (() => T) => {
  return (): T => value;
};
