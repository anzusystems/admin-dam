import { expect, test } from '@playwright/test'
import { defineRouteWalkBoot } from '@anzusystems/common-admin/e2e'
import { routeWalk } from './routeWalk'

defineRouteWalkBoot({ test, expect }, routeWalk)
