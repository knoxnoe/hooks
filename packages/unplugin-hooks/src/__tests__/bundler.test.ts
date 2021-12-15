import {
  All,
  BaseTrigger,
  Decorate,
  Delete,
  Get,
  Head,
  loadApiRoutesFromFile,
  Operator,
  OperatorType,
  Options,
  Patch,
  Post,
  Put,
} from '@midwayjs/hooks-core'
import { AbstractBundlerAdapter } from '..'
import { wrap } from 'jest-snapshot-serializer-raw'

class TestBundlerAdapter extends AbstractBundlerAdapter {
  constructor() {
    super({
      name: 'test',
      root: '/',
      source: '/',
      routes: [
        {
          baseDir: '/',
        },
      ],
    })
  }
}

it('create bundler', async () => {
  const testBundlerAdapter = new TestBundlerAdapter()
  expect(testBundlerAdapter).toBeTruthy()
  expect(testBundlerAdapter).toBeInstanceOf(AbstractBundlerAdapter)
  expect(testBundlerAdapter.getName()).toEqual('test')
})

it('generate client', async () => {
  const testBundlerAdapter = new TestBundlerAdapter()
  expect(testBundlerAdapter.generateClient([])).toEqual('')

  const apis = loadApiRoutesFromFile(
    {
      get: Decorate(Get(), async () => {}),
      post: Decorate(Post(), async () => {}),
      put: Decorate(Put(), async () => {}),
      del: Decorate(Delete(), async () => {}),
      patch: Decorate(Patch(), async () => {}),
      head: Decorate(Head(), async () => {}),
      options: Decorate(Options(), async () => {}),
      default: Decorate(All(), async () => {}),
    },
    '/index.ts',
    testBundlerAdapter.getRouter()
  )

  expect(wrap(testBundlerAdapter.generateClient(apis))).toMatchSnapshot()
})

it('with requestClient should not generate client', async () => {
  const CustomTrigger = (): Operator<void> => {
    return {
      name: 'Custom',
      metadata({ setMetadata: defineProperty }) {
        defineProperty(OperatorType.Trigger, {
          type: 'Custom',
          isCustom: true,
        })
      },
    }
  }

  const testBundlerAdapter = new TestBundlerAdapter()

  const apis = loadApiRoutesFromFile(
    {
      custom: Decorate(CustomTrigger(), async () => {}),
    },
    '/server/api/index.ts',
    testBundlerAdapter.getRouter()
  )

  expect(testBundlerAdapter.generateClient(apis)).toBe('')
})

it('with requestClient generate client', async () => {
  const CustomTrigger = (): Operator<void> => {
    return {
      name: 'Custom',
      metadata({ setMetadata: defineProperty }) {
        defineProperty<BaseTrigger>(OperatorType.Trigger, {
          type: 'Custom',
          isCustom: true,
          requestClient: {
            fetcher: 'websocket',
            client: '@midwayjs/fetch',
          },
        })
      },
    }
  }

  const testBundlerAdapter = new TestBundlerAdapter()

  const apis = loadApiRoutesFromFile(
    {
      get: Decorate(Get(), async () => {}),
      custom: Decorate(CustomTrigger(), async () => {}),
    },
    '/server/api/index.ts',
    testBundlerAdapter.getRouter()
  )

  expect(testBundlerAdapter.generateClient(apis)).toMatchSnapshot()
})

it('with requestClient generate multi client', async () => {
  const CustomTrigger = (): Operator<void> => {
    return {
      name: 'Custom',
      metadata({ setMetadata: defineProperty }) {
        defineProperty<BaseTrigger>(OperatorType.Trigger, {
          type: 'Custom',
          isCustom: true,
          requestClient: {
            fetcher: 'cloud',
            client: 'cloud-invoker',
          },
        })
      },
    }
  }

  const testBundlerAdapter = new TestBundlerAdapter()

  const apis = loadApiRoutesFromFile(
    {
      get: Decorate(Get(), async () => {}),
      custom: Decorate(CustomTrigger(), async () => {}),
    },
    '/server/api/index.ts',
    testBundlerAdapter.getRouter()
  )

  expect(wrap(testBundlerAdapter.generateClient(apis))).toMatchSnapshot()
})