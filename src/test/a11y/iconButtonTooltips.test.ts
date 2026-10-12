import { describe, expect, it } from 'vitest'
import { parse } from 'vue/compiler-sfc'
import type { SFCTemplateBlock } from 'vue/compiler-sfc'

import en from '@/locales/en'
import sk from '@/locales/sk'
import { i18n } from '@/plugins/i18n'

/* Every icon-only button of the app says what it does when it is pointed at: it has a tooltip. Read from the
 * templates of all of `src`, as `iconButtonNames.test.ts` reads the wrappers of the upload queue. A tooltip is not
 * an accessible name, and this case does not ask for one. */

const sources = import.meta.glob('/src/**/*.vue', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

type TemplateChildNode = NonNullable<SFCTemplateBlock['ast']>['children'][number]
type ElementNode = Extract<TemplateChildNode, { tag: string }>

// `NodeTypes` is a const enum of a package this app does not depend on directly.
const NodeTypes = { ELEMENT: 1, TEXT: 2, COMMENT: 3, ATTRIBUTE: 6, DIRECTIVE: 7 } as const

// Rendered elsewhere (overlays) or not text: they are not what the button shows as its own content.
const NOT_CONTENT = new Set(['VTooltip', 'VMenu', 'VDialog', 'VIcon'])

const isElement = (node: TemplateChildNode): node is ElementNode => node.type === NodeTypes.ELEMENT

const content = (children: TemplateChildNode[]): TemplateChildNode[] =>
  children.flatMap((child) => {
    if (child.type === NodeTypes.COMMENT) return []
    if (child.type === NodeTypes.TEXT) return child.content.trim() ? [child] : []
    if (isElement(child) && NOT_CONTENT.has(child.tag)) return []
    if (isElement(child) && child.tag === 'template') return content(child.children)
    return [child]
  })

/** The attribute of the element, plain or bound. */
const attribute = (el: ElementNode, name: string) =>
  el.props.find(
    (prop) =>
      (prop.type === NodeTypes.ATTRIBUTE && prop.name === name) ||
      (prop.type === NodeTypes.DIRECTIVE && prop.name === 'bind' && prop.arg?.loc.source === name)
  )

/* What Vuetify draws in a button without content: the icon when `icon` names one, and only otherwise its `text`. A
 * bare `icon` merely shapes the button, and its `text` shows. */
const showsText = (el: ElementNode) => {
  const icon = attribute(el, 'icon')
  const namesIcon = !!icon && !(icon.type === NodeTypes.ATTRIBUTE && icon.value === undefined)

  return !!attribute(el, 'text') && !namesIcon
}

// A tooltip inside the button is the button's only when the button is its activator.
const ownTooltip = (el: ElementNode) =>
  el.children.find(
    (child): child is ElementNode =>
      isElement(child) &&
      child.tag === 'VTooltip' &&
      child.props.some(
        (prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'activator' && prop.value?.content === 'parent'
      )
  )

// A tooltip around the button is the button's only when the button sits in its activator slot and binds what the
// slot hands it: the name the slot gives its `props`, which the button's `v-bind` has to mention.
const activatorSlot = (el: ElementNode) =>
  el.tag === 'template'
    ? el.props.find(
        (prop) => prop.type === NodeTypes.DIRECTIVE && prop.name === 'slot' && prop.arg?.loc.source === 'activator'
      )
    : undefined
const slotPropsName = (slot: NonNullable<ReturnType<typeof activatorSlot>>) => {
  const handed = slot.type === NodeTypes.DIRECTIVE ? (slot.exp?.loc.source.trim() ?? '') : ''
  if (!handed.startsWith('{')) return handed ? handed + '.props' : undefined
  const named = handed.match(/\bprops\b(?:\s*:\s*([A-Za-z_$][\w$]*))?/)

  return named ? (named[1] ?? 'props') : undefined
}
const bindsSlotProps = (el: ElementNode, name: string) =>
  el.props.some(
    (prop) =>
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'bind' &&
      !prop.arg &&
      new RegExp('(^|[^\\w$.])' + name.replace(/[.$]/g, '\\$&') + '(?![\\w$])').test(prop.exp?.loc.source ?? '')
  )

interface IconButton {
  at: string
  /** The source of its tooltip: the one inside it, or the one it is the activator of. */
  tooltip: string | undefined
}

const iconButtons = (path: string, source: string): IconButton[] => {
  const found: IconButton[] = []
  const sourceOf = (el: ElementNode) => source.slice(el.loc.start.offset, el.loc.end.offset)
  /** `activatorOf`: the tooltip whose activator slot the nodes are in, however deep, and the name of its props. */
  const visit = (
    nodes: TemplateChildNode[],
    activatorOf: { tooltip: ElementNode; props: string } | undefined,
    parent: ElementNode | undefined
  ) => {
    for (const node of nodes) {
      if (!isElement(node)) continue
      if (node.tag === 'VBtn' && content(node.children).length === 0 && !showsText(node)) {
        const around = activatorOf && bindsSlotProps(node, activatorOf.props) ? activatorOf.tooltip : undefined
        const tooltip = ownTooltip(node) ?? around
        found.push({ at: `${path}:${node.loc.start.line}`, tooltip: tooltip ? sourceOf(tooltip) : undefined })
      }
      const slot = parent?.tag === 'VTooltip' ? activatorSlot(node) : undefined
      const props = slot ? slotPropsName(slot) : undefined
      const slotOf = parent && props ? { tooltip: parent, props } : undefined
      visit(node.children, slotOf ?? (node.tag === 'VTooltip' ? undefined : activatorOf), node)
    }
  }
  visit(parse(source).descriptor.template?.ast?.children ?? [], undefined, undefined)

  return found
}

const buttons = Object.entries(sources).flatMap(([path, source]) => iconButtons(path, source))

// The app's own messages, the library's `common.*` among them.
i18n.global.setLocaleMessage('sk', sk)
i18n.global.setLocaleMessage('en', en as never)

describe('icon-only buttons of the app', () => {
  const one = (button: string) => iconButtons('x', `<template>${button}</template>`)
  const unnamed = [{ at: 'x:1', tooltip: undefined }]

  it('are told from the buttons with a text, and one with a tooltip from one without', () => {
    expect(one('<VBtn icon><VIcon icon="mdi-cog" /><VTooltip activator="parent">Settings</VTooltip></VBtn>')).toEqual([
      { at: 'x:1', tooltip: '<VTooltip activator="parent">Settings</VTooltip>' },
    ])
    expect(one('<VBtn icon="mdi-cog" />')).toEqual(unnamed)
    expect(one('<VBtn><VIcon icon="mdi-plus" />Add</VBtn>')).toEqual([])
    expect(one('<VBtn text="Add" />')).toEqual([])
  })

  // Vuetify draws the icon that `icon` names and leaves the `text` of such a button out.
  it('are icon-only also with a `text`, when their `icon` names an icon', () => {
    expect(one('<VBtn icon="mdi-plus" text="Add" />')).toEqual(unnamed)
    expect(one('<VBtn :icon="plus" text="Add" />')).toEqual(unnamed)
    // A bare `icon` only shapes the button: the text shows.
    expect(one('<VBtn icon text="Add" />')).toEqual([])
  })

  it('have for their tooltip only one they are the activator of', () => {
    const bound = [{ at: 'x:1', tooltip: expect.stringContaining('Settings') }]

    // Inside the button, but not told to open on it.
    expect(one('<VBtn icon><VIcon icon="mdi-cog" /><VTooltip>Settings</VTooltip></VBtn>')).toEqual(unnamed)
    expect(one('<VBtn icon><VIcon icon="mdi-cog" /><VTooltip activator="#another">Settings</VTooltip></VBtn>')).toEqual(
      unnamed
    )
    // Of something inside its menu.
    expect(
      one(
        '<VBtn icon><VIcon icon="mdi-dots" /><VMenu><VBtn>Go<VTooltip activator="parent">Where</VTooltip></VBtn></VMenu></VBtn>'
      )
    ).toEqual(unnamed)
    // Around the button: only through the activator slot, whose props the button takes.
    expect(one('<VTooltip>Settings<VBtn icon="mdi-cog" /></VTooltip>')).toEqual(unnamed)
    expect(
      one('<VTooltip>Settings<template #activator="{ props }"><VBtn icon="mdi-cog" /></template></VTooltip>')
    ).toEqual(unnamed)
    expect(
      one(
        '<VTooltip>Settings<template #activator="{ props }"><VBtn v-bind="props" icon="mdi-cog" /></template></VTooltip>'
      )
    ).toEqual(bound)
    expect(
      one(
        '<VTooltip>Settings<template #activator="{ props }"><div><VBtn v-bind="props" icon="mdi-cog" /></div></template></VTooltip>'
      )
    ).toEqual(bound)
  })

  // Something else bound to the button does not make it the activator: it has to be what the slot handed out.
  it('are the activator of a tooltip around them only when they bind the props of its slot', () => {
    const around = (slot: string, binding: string) =>
      one(`<VTooltip>Settings<template #activator="${slot}"><VBtn ${binding} icon="mdi-cog" /></template></VTooltip>`)
    const bound = [{ at: 'x:1', tooltip: expect.stringContaining('Settings') }]

    expect(around('{ props }', 'v-bind="attrs"')).toEqual(unnamed)
    expect(around('{ props: tooltip }', 'v-bind="props"')).toEqual(unnamed)
    expect(around('{ isActive }', 'v-bind="isActive"')).toEqual(unnamed)
    expect(around('{ props }', 'v-bind="otherProps"')).toEqual(unnamed)
    expect(around('{ props: tooltip }', 'v-bind="tooltip"')).toEqual(bound)
    expect(around('{ props, isActive }', 'v-bind="mergeProps(menu, props)"')).toEqual(bound)
    expect(around('slot', 'v-bind="slot.props"')).toEqual(bound)
  })

  it('are found in the templates of the app', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100)
    expect(buttons.length).toBeGreaterThan(50)
  })

  it('all have a tooltip', () => {
    expect(buttons.filter((button) => !button.tooltip).map((button) => button.at)).toEqual([])
  })

  // A tooltip is there even when its translation is not: then it would show the key.
  it.each(['sk', 'en'] as const)('say in their tooltips texts the app has in %s', (locale) => {
    const said = buttons.flatMap((button) =>
      Array.from(button.tooltip?.matchAll(/\bt\('([^']+)'/g) ?? [], (match) => ({ at: button.at, key: match[1] }))
    )
    const text = (key: string) => (i18n.global.te(key, locale) ? i18n.global.t(key, {}, { locale }) : undefined)

    expect(said.length).toBeGreaterThan(50)
    expect(said.filter(({ key }) => !text(key)?.trim() || text(key) === key)).toEqual([])
  })
})
