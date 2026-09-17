import { describe, expect, it } from 'vitest'
import declaration from '@/typed-router.d.ts?raw'
import { routeHistoryBlacklist } from '@/router/routeHistory'

// The close buttons and the two route lists each one carries.
//
// `AActionCloseButtonHistory` walks the recorded history backwards for the first entry whose name
// is not in `skipRouteNames`, and falls back to `fallbackRouteName` only when that walk comes up
// empty. Both lists are plain strings inside a template: `anzu-local/valid-route-name` only reaches
// route names written in `<script>`, and nothing type-checks a string in an attribute. Rename a
// page and the lists keep the old name, silently -- a skip list that no longer names the view it
// sits on hands the user straight back to the view they just closed.

const sources = import.meta.glob('../**/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const toSrcPath = (globPath: string) => globPath.replace(/^\.\.\//, 'src/')

const routeNames = new Set([...declaration.matchAll(/^ {4}'([^']+)': RouteRecordInfo</gm)].map(([, name]) => name))

// The declaration lists a `never` for pages that define no route; those blocks carry no quoted
// name and simply do not match.
const pageRoutes = new Map(
  [...declaration.matchAll(/'(src\/pages\/[^']+)':\s*\{\s*routes:((?:\s*\|\s*'[^']*')+)/g)].map(([, file, block]) => [
    file,
    [...block.matchAll(/'([^']*)'/g)].map(([, name]) => name),
  ])
)

const importedBy = new Map<string, Set<string>>()
for (const [path, source] of Object.entries(sources)) {
  for (const [, target] of source.matchAll(/from\s+'(@\/[^']+\.vue)'/g)) {
    const key = target.replace(/^@\//, 'src/')
    if (!importedBy.has(key)) importedBy.set(key, new Set())
    importedBy.get(key)!.add(toSrcPath(path))
  }
}

// A button sitting in a shared component belongs to whichever pages render it, however many
// levels of component sit in between.
const owningRoutes = (file: string, seen = new Set<string>()): string[] => {
  if (seen.has(file)) return []
  seen.add(file)
  const own = pageRoutes.get(file)
  if (own) return own
  return [...(importedBy.get(file) ?? [])].flatMap((parent) => owningRoutes(parent, seen))
}

const listOf = (attrs: string, name: string) => {
  const match = attrs.match(new RegExp(`:${name}="([^"]*)"`))
  return match ? [...match[1].matchAll(/'([^']*)'/g)].map(([, value]) => value) : undefined
}

const buttons = Object.entries(sources).flatMap(([path, source]) =>
  [...source.matchAll(/<AActionCloseButtonHistory(?![A-Za-z])([^>]*?)\/>/g)].map(([, attrs]) => ({
    file: toSrcPath(path),
    label: `${toSrcPath(path)}`,
    skip: listOf(attrs, 'skip-route-names'),
    // a handful of buttons compute their destination, and those hold an expression rather than a
    // literal -- the walk still has to be right, only the fallback cannot be read from here
    fallback: listOf(attrs, 'fallback-route-name'),
  }))
)

describe('close buttons', () => {
  it('finds every button, and none of the plain variant', () => {
    // A guard on the guard: were the glob to stop matching, every assertion below would iterate an
    // empty list and pass while checking nothing.
    expect(buttons.length).toBeGreaterThan(0)

    const plain = Object.entries(sources)
      .filter(([, source]) => /<AActionCloseButton(?![A-Za-z])/.test(source))
      .map(([path]) => toSrcPath(path))

    // The plain button navigates to a fixed route, so closing a record always lands on its listing
    // even when the user arrived from somewhere else entirely.
    expect(plain).toEqual([])
  })

  it.each(buttons)('$label names the routes it must not return to', ({ file, skip }) => {
    expect(skip).toBeDefined()

    const own = owningRoutes(file)
    expect(own).not.toEqual([])
    expect(own.filter((name) => !skip!.includes(name))).toEqual([])
  })

  it.each(buttons)('$label points at routes that exist', ({ skip, fallback }) => {
    expect([...(skip ?? []), ...(fallback ?? [])].filter((name) => !routeNames.has(name))).toEqual([])
  })

  it('never skips the route it falls back to', () => {
    // The fallback is where the author wants the user to land -- almost always the listing, but a
    // handful of views close one level up into a parent record instead. Skipping that route would
    // walk straight past the intended destination and only reach it in a fresh tab, where there is
    // no history left to walk.
    const bad = buttons.flatMap(({ label, skip, fallback }) =>
      (fallback ?? []).filter((name) => skip?.includes(name)).map((name) => `${label}: ${name}`)
    )

    expect(bad).toEqual([])
  })

  it('blacklists only routes that exist', () => {
    expect(routeHistoryBlacklist.filter((name) => !routeNames.has(name))).toEqual([])
  })

  it('never blacklists a route a close button falls back to', () => {
    // The fallback is the last resort when history holds nothing to return to. Pointing it at a
    // blacklisted route is not an error in itself -- the push still works -- but it means the
    // button leads somewhere the app has decided is not a place to be.
    const blacklisted = new Set(routeHistoryBlacklist)
    const bad = buttons.flatMap(({ label, fallback }) =>
      (fallback ?? []).filter((name) => blacklisted.has(name)).map((name) => `${label}: ${name}`)
    )

    expect(bad).toEqual([])
  })
})
