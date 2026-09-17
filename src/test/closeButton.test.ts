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
    // Absent means "nothing beyond my own route", which the library skips anyway -- the button
    // defaults the prop to an empty list, so it still walks back by name.
    skip: listOf(attrs, 'skip-route-names') ?? [],
    // a handful of buttons compute their destination, and those hold an expression rather than a
    // literal -- the walk still has to be right, only the fallback cannot be read from here
    fallback: listOf(attrs, 'fallback-route-name'),
    // told apart from a missing prop, so the checks that need a literal skip such a button loudly
    // rather than passing over it
    fallbackComputed: /:fallback-route-name="/.test(attrs) && !listOf(attrs, 'fallback-route-name')?.length,
  }))
)

// The longest prefix of a route whose last segment is dynamic -- `/x/[id]/edit` -> `/x/[id]`.
// Everything at or under it is another view of the same record.
const recordPrefix = (name: string) => {
  const parts = name.split('/')
  for (let i = parts.length - 1; i > 0; i--) {
    if (/\[[^\]]*\]/.test(parts[i])) return parts.slice(0, i + 1).join('/')
  }
  return name
}

const closableRoutes = [...new Set(buttons.flatMap(({ file }) => owningRoutes(file)))]

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

  it.each(buttons)('$label does not repeat the route it sits on', ({ file, skip }) => {
    // `navigateBack` skips the current route itself, so naming it here says nothing and is one
    // more string to go stale when a page is renamed. A component rendered by more than one page
    // still has to name its siblings: only the active one is skipped for it.
    const own = owningRoutes(file)
    expect(own).not.toEqual([])

    if (own.length === 1) {
      expect(skip).not.toContain(own[0])
      return
    }

    // A component rendered by more than one page is the other way round: only the ACTIVE route is
    // skipped for it, so every route it can appear on has to be named or closing one view hands the
    // user straight into its sibling.
    expect(own.filter((name) => !skip.includes(name))).toEqual([])
  })

  it.each(buttons)('$label names the sibling views of the record it closes', ({ file, skip, fallback }) => {
    // The walk must not hand back another view OF THE SAME RECORD -- its edit form, a deeper
    // record underneath it, or the create form a save redirected away from. Those are the ones
    // the caller still has to name.
    // Minus the fallback: a handful of edit views close one level up into their own detail rather
    // than to a listing, and that route is the destination, not something to walk past.
    const own = [...owningRoutes(file), ...(fallback ?? [])]
    const expected = new Set<string>()
    for (const name of owningRoutes(file)) {
      const record = recordPrefix(name)
      for (const other of closableRoutes) {
        if (own.includes(other)) continue
        if (other === record || other.startsWith(`${record}/`)) expected.add(other)
      }
      // Only when the fallback really is this record's own listing: creating pushes to the detail,
      // so closing the detail must not walk back into the empty form. A button that closes across
      // entities -- a stats detail returning to the jobs listing -- was never reached that way.
      const listing = fallback?.[0] ?? ''
      const created = `${listing}/new`
      const ownListing = listing !== '' && name.startsWith(`${listing}/`)
      if (ownListing && /\[[^\]]*\]/.test(name) && routeNames.has(created) && !own.includes(created)) {
        expected.add(created)
      }
    }

    expect([...expected].filter((name) => !skip.includes(name))).toEqual([])
  })

  it.each(buttons)('$label points at routes that exist', ({ skip, fallback }) => {
    expect([...skip, ...(fallback ?? [])].filter((name) => !routeNames.has(name))).toEqual([])
  })

  it('never skips the route it falls back to', () => {
    // The fallback is where the author wants the user to land -- almost always the listing, but a
    // handful of views close one level up into a parent record instead. Skipping that route would
    // walk straight past the intended destination and only reach it in a fresh tab, where there is
    // no history left to walk.
    const bad = buttons.flatMap(({ label, skip, fallback }) =>
      (fallback ?? []).filter((name) => skip.includes(name)).map((name) => `${label}: ${name}`)
    )

    expect(bad).toEqual([])
  })

  it('says how many buttons compute their fallback', () => {
    // Two checks below need a literal to read: "points at routes that exist" and "never skips the
    // route it falls back to". A button whose fallback is a template expression is outside both,
    // and silently so -- this states the size of that gap instead of leaving it invisible. The
    // sibling check does still cover them, since it derives from the routes they sit on.
    const computed = buttons.filter(({ fallbackComputed }) => fallbackComputed).map(({ label }) => label)

    expect(computed.length).toBeLessThanOrEqual(3)
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
