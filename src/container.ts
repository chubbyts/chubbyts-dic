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
  const _storedFactories = new Map<string, Factory>();
  const _storedServices = new Map<string, unknown>();

  const _create = <T>(id: string): T => {
    const factoryById = _storedFactories.get(id);

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

  const container: ConcreteContainer = {
    sets: (factories: Map<string, Factory>): void => {
      factories.forEach((factory, id) => {
        container.set(id, factory);
      });
    },
    set: (id: string, factory: Factory): void => {
      // eslint-disable-next-line functional/immutable-data
      _storedServices.delete(id);
      // eslint-disable-next-line functional/immutable-data
      _storedFactories.set(id, createWrapperFactory(factory, _storedFactories.get(id)));
    },
    get: <T>(id: string): T => {
      if (!_storedServices.has(id)) {
        // eslint-disable-next-line functional/immutable-data
        _storedServices.set(id, _create<T>(id));
      }

      return _storedServices.get(id) as T;
    },
    has: (id: string): boolean => _storedFactories.has(id),
  };

  return container;
};

export const createParameter = (value: unknown): (() => unknown) => {
  return (): unknown => value;
};
