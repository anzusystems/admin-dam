import { describeGeneratedRoutes } from '@anzusystems/common-admin/testing'
import { routes } from 'vue-router/auto-routes'

import declaration from '@/typed-router.d.ts?raw'

describeGeneratedRoutes({ routes, declaration, pageFiles: Object.keys(import.meta.glob('/src/pages/**/*.vue')) })
