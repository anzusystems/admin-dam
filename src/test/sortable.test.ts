import { describe, expect, it } from 'vitest'

// The list editors replaced three older ways of making a list sortable, and none of them fails a
// build if it comes back: `ASortable` and `ASortableNested` are only `@deprecated`, which shows up
// in an editor and nowhere else, and a direct `useSortable` is a perfectly valid VueUse import.
//
// What they cost is not style. The library's editors carry the reorder mode with its own undo, the
// dirty and unsaved bookkeeping, per-row validation, the delete confirmation and keyboard moves;
// each hand-rolled list re-implemented some fraction of that and skipped the rest -- two of the
// lists this replaced wrote a drag into a display array that the save path never read, so
// reordering them looked applied and was thrown away.

const sources = import.meta.glob('../**/*.{vue,ts}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const toSrcPath = (globPath: string) => globPath.replace(/^\.\.\//, 'src/')

const using = (pattern: RegExp) =>
  Object.entries(sources)
    .filter(([path]) => !path.startsWith('../test/'))
    .filter(([, source]) => pattern.test(source))
    .map(([path]) => toSrcPath(path))

describe('sortable lists', () => {
  it('reads the sources it is meant to check', () => {
    // A guard on the guard: were the glob to stop matching, every assertion below would filter an
    // empty list and pass while checking nothing.
    expect(Object.keys(sources).length).toBeGreaterThan(50)
  })

  it('uses no deprecated sortable component', () => {
    expect(using(/<ASortable(?:Nested)?(?![A-Za-z])/)).toEqual([])
  })

  it('calls no sortable library directly', () => {
    // `ASortableListEditor` wraps `useSortable` itself; what is out of place is an admin reaching
    // past the editor for the same thing.
    expect(using(/from\s+'(?:@vueuse\/integrations\/useSortable|sortablejs)'/)).toEqual([])
  })
})
