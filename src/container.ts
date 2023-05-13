import type { Container } from '@chubbyts/chubbyts-dic-types/dist/container';

export type Factory = (container: Container, existingFactory?: Factory) => unknown;

export type ConcreteContainer = {
  sets: (factories: Map<string, Factory>) => void;
  set: (id: string, factory: Factory) => void;
} & Container;

const createWrapperFactory = (newFactory: Factory, existingFactory?: Factory): Factory => {
  return (container: Container): unknown => newFactory(container, existingFactory);
};

export const createContainer = (): ConcreteContainer => {
  const storedFactories = new Map<string, Factory>();
  const storedServices = new Map<string, unknown>();

  const sets = (factories: Map<string, Factory>): void => {
    factories.forEach((factory, id) => {
      set(id, factory);
    });
  };

  const set = (id: string, factory: Factory): void => {
    storedServices.delete(id);
    storedFactories.set(id, createWrapperFactory(factory, storedFactories.get(id)));
  };

  const get = <T>(id: string): T => {
    if (!storedServices.has(id)) {
      storedServices.set(id, create<T>(id));
    }

    return storedServices.get(id) as T;
  };

  const has = (id: string): boolean => storedFactories.has(id);

  const container: ConcreteContainer = {
    sets,
    set,
    get,
    has,
  };

  const create = <T>(id: string): T => {
    const factoryById = storedFactories.get(id);

    if (!factoryById) {
      throw new Error(`There is no service with id "${id}"`);
    }

    try {
      return factoryById(container) as T;
    } catch (e) {
      const error: Error & { cause?: unknown } = new Error(`Could not create service with id "${id}"`);
      // eslint-disable-next-line functional/immutable-data
      error.cause = e;

      throw error;
    }
  };

  return container;
};

export const createParameter = (value: unknown): (() => unknown) => {
  return (): unknown => value;
};
