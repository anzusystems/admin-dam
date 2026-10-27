import { describeCssLayerOrder } from '@anzusystems/common-admin/testing'

describeCssLayerOrder({
  indexHtml: Object.values(
    import.meta.glob<string>('/index.html', { query: '?raw', import: 'default', eager: true })
  )[0],
})
