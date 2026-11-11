import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

import { LOG_SYSTEM } from '@/domains/system/logSystems'

// The guard reads `meta.superAdminOf` and gets `undefined` when it is absent.
// A log page that omits or misspells it is not refused. It passes with no check,
// and `requiredPermissions: []` lets it past the other gate too. Nothing reports this.
// This is pinned here because `definePage` meta is not checked against the `RouteMeta` augmentation.
// This exact mismatch once shipped green.
const router = createRouter({ history: createMemoryHistory(), routes })

const logRoutes = router.getRoutes().filter((record) => record.path.includes('/logs/'))

describe('log routes', () => {
  it('has log routes to check', () => {
    expect(logRoutes.length).toBeGreaterThan(0)
  })

  it('gates every one of them on the superadmin of the backend it reads', () => {
    const ungated = logRoutes
      .filter((record) => record.meta?.superAdminOf !== LOG_SYSTEM.authSystem)
      .map((record) => `${record.path} declares ${String(record.meta?.superAdminOf)}`)

    expect(ungated).toEqual([])
  })
})
