import { describeAlertHost } from '@anzusystems/common-admin/testing'

describeAlertHost({
  sources: import.meta.glob<string>(['/src/**/*.vue', '!/src/test/**'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
})
