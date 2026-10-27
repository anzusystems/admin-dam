import { afterEach, describe, expect, it, vi } from 'vitest'

/*
 * The notification service is taken from `config.json` as the file has it.
 * The poll of the upload queue has no switch and always runs.
 */

const template = Object.values(
  import.meta.glob<string>('/public/config.json.dist', { query: '?raw', import: 'default', eager: true })
)[0]

const deployed = (over: Record<string, unknown> = {}) => ({
  adminSwitcherConfigUrl: '',
  appEnvironment: 'test',
  appVersion: '1',
  appLabel: '',
  logoutCoreDamUrl: '',
  cookies: { refreshTokenExistsName: 'rte', jwtPayloadName: 'jp' },
  dam: { apiUrl: 'https://dam.test', apiTimeout: 30, adminUrl: 'https://admin.test', authorCleanPhraseTestSample: '' },
  notification: { enabled: true, webSocketUrl: 'wss://notifications.test/ws' },
  sentry: { dsn: '' },
  ...over,
})

const startWith = async (config: Record<string, unknown>) => {
  vi.resetModules()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => config,
    }))
  )
  const { envConfig, loadEnvConfig } = await import('@/shared/EnvConfigService')
  const started = vi.fn()
  await loadEnvConfig(started)
  expect(started).toHaveBeenCalledTimes(1)

  return envConfig
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the config template of the application', () => {
  const keys = JSON.parse(template.replace(/: \$\{\w+\}/g, ': true')) as Record<string, unknown>

  it('has no switch for the poll of the upload queue', () => {
    expect(keys).not.toHaveProperty('uploadStatusFallback')
    expect(template).not.toContain('UPLOAD_STATUS_FALLBACK')
  })

  it('still says whether the notification service is on, and where it is', () => {
    expect(Object.keys(keys.notification as object)).toEqual(['enabled', 'webSocketUrl'])
  })
})

describe('the config the application starts with', () => {
  it('has no switch for the poll of the upload queue by itself', async () => {
    const { envConfig } = await import('@/shared/EnvConfigService')

    expect(envConfig).not.toHaveProperty('uploadStatusFallback')
  })

  it.each([true, false])('takes no switch for the poll from a config that still has it (%s)', async (value) => {
    const envConfig = await startWith(deployed({ uploadStatusFallback: value }))

    expect(envConfig).not.toHaveProperty('uploadStatusFallback')
  })

  // The library decides what switches the service on, from the value
  // as the file has it. A text in quotes is handed on as that text.
  it.each([true, false, 'true', 'false', ' TRUE '])(
    'hands on the switch of the notification service as it is: %j',
    async (enabled) => {
      const envConfig = await startWith(
        deployed({ notification: { enabled, webSocketUrl: 'wss://notifications.test/ws' } })
      )

      expect(envConfig.notification).toEqual({ enabled, webSocketUrl: 'wss://notifications.test/ws' })
    }
  )
})

describe('a config that says less than everything of the notification service', () => {
  const withBlock = (notification?: Record<string, unknown>) => {
    const config: Record<string, unknown> = deployed()
    if (notification) config.notification = notification
    else delete config.notification

    return config
  }

  it('starts the application without the block, with the service off', async () => {
    const envConfig = await startWith(withBlock())

    expect(envConfig.notification).toEqual({ enabled: false, webSocketUrl: '' })
  })

  const partial: Array<[Record<string, unknown>, { enabled: boolean | string; webSocketUrl: string }]> = [
    [{}, { enabled: false, webSocketUrl: '' }],
    [{ enabled: true }, { enabled: true, webSocketUrl: '' }],
    [{ enabled: 'true' }, { enabled: 'true', webSocketUrl: '' }],
    [{ webSocketUrl: 'wss://notifications.test/ws' }, { enabled: false, webSocketUrl: 'wss://notifications.test/ws' }],
  ]

  it.each(partial)('takes what the block says and has the rest off or empty: %j', async (notification, expected) => {
    const envConfig = await startWith(withBlock(notification))

    expect(envConfig.notification).toEqual(expected)
  })
})
