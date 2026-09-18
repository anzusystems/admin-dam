import { describe, expect, it } from 'vitest'

// Where the alerts actually land.
//
// `AAlerts` is the host every `showError` / `showWarning` in this admin renders into, and it used to
// sit in the drawer layout alone. Anything raised while a different layout is on screen -- the
// loader, which is what the app shows until the first route resolves, or the fullscreen one behind
// login, logout, unauthorized and the 404 -- had nowhere to go. A notification is a bare emit with
// no buffer: raised with no host mounted it is dropped, not queued for when one arrives.
//
// The rule is derived from what the pages ask for rather than from a list written here, so a new
// layout, or an existing one a page starts using, is covered without anyone remembering this file.
// Exactly one layout is mounted at a time (`AppLayout.vue` renders `<component :is="layout">`), so a
// host in each of them never doubles an alert.

const pages = import.meta.glob('../../pages/**/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const layouts = import.meta.glob('../../layouts/AppLayout*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const switchSource = layouts[Object.keys(layouts).find((path) => path.endsWith('/AppLayout.vue')) ?? ''] ?? ''
const defaultLayout = switchSource.match(/defaultLayout\s*=\s*'([^']+)'/)?.[1]

const referenced = new Set<string>()
for (const source of Object.values(pages)) {
  for (const [, name] of source.matchAll(/layout:\s*'([^']+)'/g)) referenced.add(name)
}
if (defaultLayout) referenced.add(defaultLayout)

const sourceOf = (name: string) => layouts[Object.keys(layouts).find((path) => path.endsWith(`/${name}.vue`)) ?? '']

describe('the alerts host', () => {
  it('found the layouts the pages ask for', () => {
    // A guard on the guard: were either glob to stop matching, the assertion below would run over an
    // empty set and pass while checking nothing.
    expect(defaultLayout).toBeTypeOf('string')
    expect(referenced.size).toBeGreaterThan(1)
    expect([...referenced].filter((name) => sourceOf(name) === undefined)).toEqual([])
  })

  it('is in every layout that can be on screen by itself', () => {
    const without = [...referenced].filter((name) => !/<AAlerts\s*\/>/.test(sourceOf(name) ?? '')).sort()

    expect(without).toEqual([])
  })
})
