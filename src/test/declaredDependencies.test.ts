import { describeDeclaredDependencies } from '@anzusystems/common-admin/testing'
import type { PackageJsonDependencies } from '@anzusystems/common-admin/testing'

describeDeclaredDependencies({
  sources: import.meta.glob(['/src/**/*.{vue,ts,mts,scss}'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  packageJson: import.meta.glob<PackageJsonDependencies>('/package.json', { import: 'default', eager: true })[
    '/package.json'
  ]!,
})
