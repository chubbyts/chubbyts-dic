# chubbyts-dic

[![CI](https://github.com/chubbyts/chubbyts-dic/workflows/CI/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-dic/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-dic/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-dic?branch=master)
[![Infection MSI](https://badge.stryker-mutator.io/github.com/chubbyts/chubbyts-dic/master)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-dic/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-dic.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-dic)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-dic&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-dic)

## Description

Dependency injection container (DIC), [PSR-11][2] inspired.

## Requirements

 * node: 14
 * [chubbyts/chubbyts-dic-types][3]: ^1.0.0

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-dic][1].

```ts
npm i @chubbyts/chubbyts-dic
```

## Usage

### Sets

```ts
import { Container } from '@chubbyts/chubbyts-dic-types/dist/container';
import { createContainer } from '@chubbyts/chubbyts-dic/dist/container';
import { Logger } from 'some-logger/dist/logger';
import { createMyService, decorateMyService, MyService } from './service/my-service';

const container = createContainer();

container.sets(new Map([
    ['myService', (container: Container): MyService => {
        return createMyService(container.get<Logger>('logger'));
    }]
]));

```

### Set

```ts
import { Container } from '@chubbyts/chubbyts-dic-types/dist/container';
import { createContainer, createParameter, Factory } from '@chubbyts/chubbyts-dic/dist/container';
import { Cache } from 'some-cache/dist/cache';
import { Logger } from 'some-logger/dist/logger';
import { createMyService, MyService } from './service/my-service';

const container = createContainer();

// new
container.set('myService', (container: Container): MyService => {
    return createMyService(container.get<Logger>('logger'));
});

// existing (replace)
container.set('myService', (container: Container): MyService => {
    return createMyService(container.get<Logger>('logger'));
});

// existing (extend)
container.set('myService', (container: Container, existingFactory?: Factory): MyService => {
    if (!existingFactory) {
        throw 'Missing service';
    }

    return decorateMyService(existingFactory(container), container.get<Cache>('cache'));
});

// parameter
container.set('param', createParameter('value'));
```

### Get

```ts
import { createContainer } from '@chubbyts/chubbyts-dic/dist/container';
import { MyService } from './service/my-service';

const container = createContainer();

container.get<MyService>('myService');
```

### Has

```ts
import { createContainer } from '@chubbyts/chubbyts-dic/dist/container';

const container = createContainer();

container.has('myService');
```

## Copyright

Dominik Zogg 2022

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic
[2]: https://www.php-fig.org/psr/psr-11
[3]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-types
