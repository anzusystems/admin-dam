import { describeSortableLists } from '@anzusystems/common-admin/testing'

describeSortableLists({
  sources: import.meta.glob<string>('/src/**/*.{vue,ts}', { query: '?raw', import: 'default', eager: true }),
})
