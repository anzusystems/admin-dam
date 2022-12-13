import { beforeAll } from 'vitest'
;(global as any).CSS = { supports: () => false }

beforeAll(() => {
  console.log('beforeAll')
  global.CSS = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supports: (str: string) => false,
    escape: (str: string) => str,
  }
  console.log('CSS.support:' + CSS.supports('selector(:focus-visible)'))
})
