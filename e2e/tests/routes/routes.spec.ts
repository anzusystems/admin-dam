import { expect, test } from '@playwright/test'
import { defineRouteWalk } from '@anzusystems/common-admin/e2e'
import { routeWalk } from './routeWalk'

defineRouteWalk({ test, expect }, routeWalk)
