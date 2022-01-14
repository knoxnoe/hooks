---
title: 接口开发
---

## 路由

在 Midway Hooks 中，你可以通过 `@midwayjs/hooks` 提供的 `Api()` 函数来快速创建接口。

Hello World 示例：

```ts
// src/hello.ts
import {
  Api,
  Get,
} from '@midwayjs/hooks';

export default Api(
  Get(), // Http Path: /api/hello,
  async () => {
    return 'Hello World!';
  }
);
```

一个 API 接口由以下部分组成：

- `Api()`：定义接口函数
- `Get(path?: string)`：指定 Http 触发器，指定请求方法为 GET，可选参数 `path` 为接口路径，不指定路径的情况下会根据`函数名 + 文件名`生成路径
- `Handler: async (...args: any[]) => { ... }`：用户逻辑，处理请求并返回结果

指定路径例子如下。

```ts
// src/hello.ts
import {
  Api,
  Get,
} from '@midwayjs/hooks';

export default Api(
  Get('/hello'), // Http Path: /hello,
  async () => {
    return 'Hello World!';
  }
);
```

### 传递参数

在 Midway Hooks 中，接口的入参就是声明函数的参数。

基础示例如下：

```ts
import {
  Api,
  Post,
} from '@midwayjs/hooks';

export default Api(
  Post(), // Http Path: /api/say,
  async (name: string) => {
    return `Hello ${name}!`;
  }
);
```

你可以用两种方式来调用接口。

1. 全栈项目：导入接口并调用

```ts
import say from './api';

const response = await say('Midway');
console.log(response); // Hello Midway!
```

2. 手动调用

在 Http 下，`Handler(...args: any[])` 的入参，可以在手动请求时通过设置 Http Body 的 args 参数来传递参数。

如下所示：

```ts
fetch('/api/say', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    args: ['Midway'],
  }),
})
  .then((res) => res.text())
  .then((res) => console.log(res)); // Hello Midway!
```

## 请求上下文（Context / Request / Response）

你可以通过 `@midwayjs/hooks` 提供的 `useContext` 来获取请求上下文对象。

请求上下文由底层框架决定（Web 下为 `@midwayjs/koa`，FaaS 下为 `@midwayjs/faas`）。

以使用 [Koa](https://koajs.com/) 框架为例，那么 `useContext` 将返回 Koa 的 [Context](https://koajs.com/#context) 对象。

基础示例：

1. 获取请求 Method 和 Path

```ts
import {
  Api,
  Get,
  useContext,
} from '@midwayjs/hooks';
import { Context } from '@midwayjs/koa';

export default Api(Get(), async () => {
  const ctx = useContext<Context>();
  return {
    method: ctx.method,
    path: ctx.path,
  };
});
```

2. 设置返回的 Header

```ts
import {
  Api,
  Get,
  useContext,
} from '@midwayjs/hooks';

export default Api(Get(), async () => {
  const ctx = useContext<Context>();
  ctx.set('X-Powered-By', 'Midway');
  return 'Hello World!';
});
```

同时我们也可以通过 `SetHeader(key: string, value: string)` 来设置 Header

```ts
import {
  Api,
  Get,
  SetHeader,
} from '@midwayjs/hooks';

export default Api(
  Get(),
  SetHeader('X-Powered-By', 'Midway'),
  async () => {
    return 'Hello World!';
  }
);
```

## Http 触发器

| 触发器                   | 注释                        |
| ------------------------ | --------------------------- |
| `All(path?: string)`     | 接受所有 Http Method 的请求 |
| `Get(path?: string)`     | 接受 GET 请求               |
| `Post(path?: string)`    | 接受 POST 请求              |
| `Put(path?: string)`     | 接受 PUT 请求               |
| `Delete(path?: string)`  | 接受 DELETE 请求            |
| `Patch(path?: string)`   | 接受 PATCH 请求             |
| `Head(path?: string)`    | 接受 HEAD 请求              |
| `Options(path?: string)` | 接受 OPTIONS 请求           |

### 查询参数 Query

查询参数可以实现在 URL 上传递参数的方式。

如果希望接口路径是 `/articles?page=0&limit=10`，可以这样写。

```ts
import {
  Api,
  Get,
  Query,
  useContext,
} from '@midwayjs/hooks';

export default Api(
  Get(),
  Query<{
    page: string;
    limit: string;
  }>(),
  async () => {
    const ctx = useContext();
    return {
      page: ctx.query.page,
      limit: ctx.query.limit,
    };
  }
);
```

一体化调用：

```ts
import getArticles from './api';
const response = await getArticles({
  query: { page: '0', limit: '10' },
});
console.log(response); // { page: '0', limit: '10' }
```

手动调用：

```ts
fetch('/api/articles?page=0&limit=10')
  .then((res) => res.json())
  .then((res) => console.log(res)); // { page: '0', limit: '10' }
```

### 路径参数 Params

路径参数可以实现动态路径和从路径中获取参数的功能。

如果希望接口路径是 `/article/100`，并获取 id 为 `100` 的值，可以这样写：

```ts
import { Api, Get, Params, useContext } from '@midwayjs/hooks'

export default Api(
  Get('/article/:id'),
  Params<{ id: string }>(,
  async () => {
    const ctx = useContext()
    return {
      article: ctx.params.id
    }
  }
)
```

一体化调用：

```ts
import getArticle from './api/article';
const response = await getArticle({
  params: { id: '100' },
});
console.log(response); // { article: '100' }
```

手动调用：

```ts
fetch('/article/100')
  .then((res) => res.json())
  .then((res) => console.log(res)); // { article: '100' }
```

### 请求头 Headers

请求头可以实现通过 Http Headers 传递参数的功能。

如果希望请求 `/auth`，并在 `Request Headers` 中 传递 token，可以这样写：

```ts
import {
  Api,
  Get,
  Headers,
  useContext,
} from '@midwayjs/hooks';

export default Api(
  Get('/auth'),
  Headers<{ token: string }>(),
  async () => {
    const ctx = useContext();
    return {
      token: ctx.headers.token,
    };
  }
);
```

一体化调用：

```ts
import getAuth from './api/auth';
const response = await getAuth({
  headers: { token: '123456' },
});
console.log(response); // { token: '123456' }
```

前端调用：

```ts
fetch('/auth', {
  headers: {
    token: '123456',
  },
})
  .then((res) => res.json())
  .then((res) => console.log(res)); // { token: '123456' }
```

## 状态码

使用 `HttpCode(status: number)`：

```ts
import {
  Api,
  Get,
  HttpCode,
} from '@midwayjs/hooks';

export default Api(
  Get(),
  HttpCode(201),
  async () => {
    return 'Hello World!';
  }
);
```

手动设置：

```ts
import {
  Api,
  Get,
  useContext,
} from '@midwayjs/hooks';

export default Api(Get(), async () => {
  const ctx = useContext<Context>();
  ctx.status = 201;
  return 'Hello World!';
});
```

## 设置 Headers

使用：`SetHeader(key: string, value: string)`

```ts
import {
  Api,
  Get,
  SetHeader,
} from '@midwayjs/hooks';

export default Api(
  Get(),
  SetHeader('X-Powered-By', 'Midway'),
  async () => {
    return 'Hello World!';
  }
);
```

手动设置：

```ts
import {
  Api,
  Get,
  useContext,
} from '@midwayjs/hooks';

export default Api(Get(), async () => {
  const ctx = useContext<Context>();
  ctx.set('X-Powered-By', 'Midway');
  return 'Hello World!';
});
```

## 重定向

使用 `Redirect(url: string, code?: number = 302)`：

```ts
import {
  Api,
  Get,
  Redirect,
} from '@midwayjs/hooks';

export default Api(
  Get('/demo'),
  Redirect('/hello'),
  async () => {}
);
```

手动设置：

```ts
import {
  Api,
  Get,
  useContext,
} from '@midwayjs/hooks';

export default Api(
  Get('/demo'),
  async () => {
    const ctx = useContext<Context>();
    ctx.redirect('/hello');
  }
);
```

## 返回值类型 ContentType

使用 `ContentType(type: string)`：

```ts
import {
  Api,
  Get,
  ContentType,
} from '@midwayjs/hooks';

export default Api(
  Get(),
  ContentType('text/html'),
  async () => {
    return '<h1>Hello World!</h1>';
  }
);
```

手动设置：

```ts
import {
  Api,
  Get,
  useContext,
} from '@midwayjs/hooks';

export default Api(Get(), async () => {
  const ctx = useContext<Context>();
  ctx.type = 'text/html';
  return '<h1>Hello World!</h1>';
});
```