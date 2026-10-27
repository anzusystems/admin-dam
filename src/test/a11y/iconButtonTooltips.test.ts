import { describe, expect, it } from 'vitest'
import { parse } from 'vue/compiler-sfc'
import type { SFCTemplateBlock } from 'vue/compiler-sfc'

import toolbar from '@/domains/coreDam/shared/components/anzutap/components/anzutapToolbar.ts?raw'
import en from '@/locales/en'
import sk from '@/locales/sk'
import { i18n } from '@/plugins/i18n'

/*
 * Every icon-only control must say what it does: a tooltip for the pointer and an accessible name for screen readers.
 * A tooltip is not a name: it gives `aria-describedby`, renders only while open and is hidden on touch devices.
 * Reads the templates of all `src`, as the library does (`src/test/a11y/iconButtonNames.test.ts` there).
 * Controls: icon-only buttons (`VBtn`, library aliases, app bar hamburger), a
 * `VIcon` with a click (Vuetify renders `role="button"`), and a list item that links
 * somewhere and shows only icons. Library components are guarded by the library.
 */

const sources = import.meta.glob('/src/**/*.vue', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

type TemplateChildNode = NonNullable<SFCTemplateBlock['ast']>['children'][number]
type ElementNode = Extract<TemplateChildNode, { tag: string }>

// `NodeTypes` is a const enum of a package this app does not depend on directly.
const NodeTypes = { ELEMENT: 1, TEXT: 2, COMMENT: 3, INTERPOLATION: 5, ATTRIBUTE: 6, DIRECTIVE: 7 } as const

const BUTTONS = new Set(['VBtn', 'ABtnIcon', 'ABtnPrimary', 'ABtnSecondary', 'ABtnTertiary', 'VAppBarNavIcon'])
// Binding the props of the activator slot opens these overlays. Menu and dialog also hand the activator a click.
const OVERLAYS = new Set(['VTooltip', 'VMenu', 'VDialog'])
// Overlay content is rendered elsewhere and icons are not text, so neither counts as the button's own content.
const NOT_CONTENT = new Set([...OVERLAYS, 'VIcon'])

const isElement = (node: TemplateChildNode): node is ElementNode => node.type === NodeTypes.ELEMENT

const content = (children: TemplateChildNode[]): TemplateChildNode[] =>
  children.flatMap((child) => {
    if (child.type === NodeTypes.COMMENT) return []
    if (child.type === NodeTypes.TEXT) return child.content.trim() ? [child] : []
    if (isElement(child) && NOT_CONTENT.has(child.tag)) return []
    if (isElement(child) && child.tag === 'template') return content(child.children)
    return [child]
  })

const attribute = (el: ElementNode, name: string) =>
  el.props.find(
    (prop) =>
      (prop.type === NodeTypes.ATTRIBUTE && prop.name === name) ||
      (prop.type === NodeTypes.DIRECTIVE && prop.name === 'bind' && prop.arg?.loc.source === name)
  )

const valueOf = (el: ElementNode, name: string) => {
  const prop = attribute(el, name)
  if (!prop) return undefined
  if (prop.type === NodeTypes.ATTRIBUTE) return JSON.stringify(prop.value?.content ?? '')

  return prop.type === NodeTypes.DIRECTIVE ? prop.exp?.loc.source.trim() : undefined
}

const listens = (el: ElementNode, event: string) =>
  el.props.some((prop) => prop.type === NodeTypes.DIRECTIVE && prop.name === 'on' && prop.arg?.loc.source === event)

/*
 * Vuetify draws the `icon` in a content-less button when it names an icon, and only otherwise its `text`.
 * A bare `icon` only shapes the button, and its `text` shows. The hamburger always draws its icon `$menu`.
 */
const showsText = (el: ElementNode) => {
  const icon = attribute(el, 'icon')
  const namesIcon =
    el.tag === 'VAppBarNavIcon' || (!!icon && !(icon.type === NodeTypes.ATTRIBUTE && icon.value === undefined))

  return !!attribute(el, 'text') && !namesIcon
}

// A tooltip inside the button belongs to it only when the button is its activator.
const ownTooltip = (el: ElementNode) =>
  el.children.find(
    (child): child is ElementNode =>
      isElement(child) &&
      child.tag === 'VTooltip' &&
      child.props.some(
        (prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'activator' && prop.value?.content === 'parent'
      )
  )

// An overlay around a control belongs to it only when the control
// sits in the activator slot and binds what the slot hands it.
// The control's `v-bind` must mention the name the slot gives its `props`.
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

interface ActivatorSlot {
  overlay: ElementNode
  props: string
}

type Kind = 'button' | 'icon' | 'listItem'

const kindOf = (el: ElementNode, insideButton: boolean, bound: ActivatorSlot[]): Kind | undefined => {
  if (BUTTONS.has(el.tag)) return content(el.children).length === 0 && !showsText(el) ? 'button' : undefined
  // The icon of a button is the button's content, not a separate control.
  if (el.tag === 'VIcon') {
    return !insideButton && (listens(el, 'click') || bound.some((slot) => slot.overlay.tag !== 'VTooltip'))
      ? 'icon'
      : undefined
  }
  const leads = ['to', 'href', 'link'].some((name) => attribute(el, name)) || listens(el, 'click')
  const titled = ['title', 'subtitle'].some((name) => attribute(el, name))
  if (el.tag === 'VListItem') return leads && !titled && content(el.children).length === 0 ? 'listItem' : undefined

  return undefined
}

interface Said {
  keys: string[]
  other: boolean
}
const saidBy = (el: ElementNode): Said => {
  const said: Said = { keys: [], other: false }
  const visit = (nodes: TemplateChildNode[]) => {
    for (const node of nodes) {
      if (node.type === NodeTypes.TEXT && node.content.trim()) said.other = true
      if (node.type === NodeTypes.INTERPOLATION) {
        const key = node.content.loc.source.trim().match(/^t\('([^']+)'\)$/)?.[1]
        if (key) said.keys.push(key)
        else said.other = true
      }
      if (isElement(node) && !OVERLAYS.has(node.tag)) visit(node.children)
    }
  }
  visit(el.children)

  return said
}

const tooltipSays = (tooltip: ElementNode) => {
  const said = tooltip.children.filter(
    (child) =>
      child.type !== NodeTypes.COMMENT &&
      !(child.type === NodeTypes.TEXT && !child.content.trim()) &&
      !(isElement(child) && activatorSlot(child))
  )
  const text = attribute(tooltip, 'text')
  if (!said.length) return text?.type === NodeTypes.DIRECTIVE ? text.exp?.loc.source.trim() : undefined
  const [only] = said

  return said.length === 1 && only?.type === NodeTypes.INTERPOLATION && !text
    ? only.content.loc.source.trim()
    : undefined
}

const TERNARY = /\?(?![?.])[\s\S]*:/
const ownIcons = (children: TemplateChildNode[]): ElementNode[] =>
  children.flatMap((child) => {
    if (!isElement(child) || OVERLAYS.has(child.tag)) return []

    return child.tag === 'VIcon' ? [child] : ownIcons(child.children)
  })
const swapsIcon = (el: ElementNode) => {
  const icons = ownIcons(el.children)
  const drawnIf = icons.filter((icon) =>
    icon.props.some(
      (prop) => prop.type === NodeTypes.DIRECTIVE && ['if', 'else-if', 'else', 'show'].includes(prop.name)
    )
  )
  const picked = [el, ...icons].some((one) => {
    const icon = attribute(one, 'icon')

    return icon?.type === NodeTypes.DIRECTIVE && TERNARY.test(icon.exp?.loc.source ?? '')
  })

  return drawnIf.length >= 2 || picked
}

interface Control {
  at: string
  path: string
  kind: Kind
  label: string | undefined
  labelledBy: { by: string; labels: Array<Said | undefined> } | undefined
  tooltip: string | undefined
  says: string | undefined
  active: string | undefined
  pressed: string | undefined
  expanded: string | undefined
  swapsIcon: boolean
}

const controls = (path: string, source: string): Control[] => {
  type Apart = ElementNode | undefined
  const found: Array<{ el: ElementNode; kind: Kind; tooltip: ElementNode | undefined; apart: Apart }> = []
  const elements: Array<{ el: ElementNode; apart: Apart }> = []
  const sourceOf = (el: ElementNode) => source.slice(el.loc.start.offset, el.loc.end.offset)
  /** `slots`: the activator slots the nodes are in, at any depth. `apart`: the overlay whose content they are. */
  const visit = (nodes: TemplateChildNode[], slots: ActivatorSlot[], insideButton: boolean, apart: Apart) => {
    for (const node of nodes) {
      if (!isElement(node)) continue
      elements.push({ el: node, apart })
      const bound = slots.filter((slot) => bindsSlotProps(node, slot.props))
      const kind = kindOf(node, insideButton, bound)
      const around = bound.find((slot) => slot.overlay.tag === 'VTooltip')?.overlay
      if (kind) found.push({ el: node, kind, tooltip: ownTooltip(node) ?? around, apart })
      const inside = BUTTONS.has(node.tag) || (insideButton && !NOT_CONTENT.has(node.tag))
      for (const child of node.children) {
        if (!OVERLAYS.has(node.tag)) {
          visit([child], slots, inside, apart)
          continue
        }
        // Binding the props of the activator slot opens the overlay.
        // The rest of the element is overlay content, drawn apart.
        const slot = isElement(child) ? activatorSlot(child) : undefined
        const props = slot ? slotPropsName(slot) : undefined
        visit([child], slot ? (props ? [...slots, { overlay: node, props }] : slots) : [], inside, slot ? apart : node)
      }
    }
  }
  visit(parse(source).descriptor.template?.ast?.children ?? [], [], false, undefined)

  /*
   * Ids of a plain `aria-labelledby` match a plain `id`; a bound one matches the same bound `id`.
   * Only elements drawn with the control count, not overlay content drawn apart. That
   * exists only while the overlay is open, and a tooltip never on touch screens.
   */
  const labelsOf = (by: string, apart: Apart) =>
    (by.startsWith('"')
      ? (JSON.parse(by) as string)
          .split(/\s+/)
          .filter(Boolean)
          .map((id) => JSON.stringify(id))
      : [by]
    )
      .map((id) => elements.find((one) => one.apart === apart && valueOf(one.el, 'id') === id)?.el)
      .map((el) => el && saidBy(el))

  return found.map(({ el, kind, tooltip, apart }) => {
    const by = valueOf(el, 'aria-labelledby')

    return {
      at: `${path}:${el.loc.start.line}`,
      path,
      kind,
      label: valueOf(el, 'aria-label'),
      labelledBy: by ? { by, labels: labelsOf(by, apart) } : undefined,
      tooltip: tooltip ? sourceOf(tooltip) : undefined,
      says: tooltip ? tooltipSays(tooltip) : undefined,
      active: valueOf(el, 'active'),
      pressed: valueOf(el, 'aria-pressed'),
      expanded: valueOf(el, 'aria-expanded'),
      swapsIcon: swapsIcon(el),
    }
  })
}

const all = Object.entries(sources).flatMap(([path, source]) => controls(path, source))

i18n.global.setLocaleMessage('sk', sk)
i18n.global.setLocaleMessage('en', en as never)
const text = (key: string, locale: 'sk' | 'en') =>
  i18n.global.te(key, locale) ? i18n.global.t(key, {}, { locale }) : undefined
const untranslated = (keys: string[]) =>
  keys.flatMap((key) =>
    (['sk', 'en'] as const)
      .filter((locale) => !text(key, locale)?.trim() || text(key, locale) === key)
      .map((locale) => `${locale} ${key}`)
  )

const KEY_LABEL = /^t\('([^']+)'(?:,[\s\S]*)?\)$/

/**
 * Collects what elements of the tag get for the prop: plain kebab-case values, and
 * where it is given otherwise (bound or camel case), which this guard does not read.
 */
const givenTo = (tag: string, prop: string, from: Record<string, string> = sources) => {
  const camel = prop.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
  const values: string[] = []
  const unread: string[] = []
  for (const [path, source] of Object.entries(from)) {
    const visit = (nodes: TemplateChildNode[]) => {
      for (const node of nodes) {
        if (!isElement(node)) continue
        for (const given of node.tag === tag ? node.props : []) {
          const name =
            given.type === NodeTypes.ATTRIBUTE ? given.name : given.name === 'bind' ? given.arg?.loc.source : ''
          if (name !== prop && name !== camel) continue
          if (given.type === NodeTypes.ATTRIBUTE && name === prop && given.value) values.push(given.value.content)
          else unread.push(`${path}:${node.loc.start.line}`)
        }
        visit(node.children)
      }
    }
    visit(parse(source).descriptor.template?.ast?.children ?? [])
  }

  return { values, unread }
}

/*
 * Names a template cannot spell out, with every key they can take.
 * The button that changes a file route names itself by its prop (default and
 * callers' values). Editor toolbar buttons are named by the toolbar list.
 */
const ROUTE_CHANGE = '/src/domains/coreDam/shared/assetFileRoute/components/AssetFileRouteChangeBtn.vue'
const TOOLBAR_ITEM = '/src/domains/coreDam/shared/components/anzutap/components/AnzutapToolbarItem.vue'
const DYNAMIC: Record<string, { label: string; keys: () => string[] }> = {
  [ROUTE_CHANGE]: {
    label: 't(buttonT)',
    keys: () => [
      ...Array.from(sources[ROUTE_CHANGE]?.matchAll(/\bbuttonT: '([^']+)'/g) ?? [], (match) => match[1]!),
      ...givenTo('AssetFileRouteChangeBtn', 'button-t').values,
    ],
  },
  [TOOLBAR_ITEM]: {
    label: 't(item.titleT)',
    keys: () => Array.from(toolbar.matchAll(/\btitleT: '([^']+)'/g), (match) => match[1]!),
  },
}

// Named but drawn without a tooltip: the layout hamburger and the search icon at the end of its field.
// Matched by file and name, because other controls in these files do have tooltips.
const WITHOUT_TOOLTIP = [
  ['/src/layouts/AppLayoutDrawer.vue', "t('system.mainBar.mainMenu')"],
  ['/src/domains/coreDam/asset/components/toolbar/AssetSearchInput.vue', "t('system.mainBar.search')"],
]
const withoutTooltip = (list: Control[]) =>
  list
    .filter(
      ({ path, label, tooltip }) => !tooltip && !WITHOUT_TOOLTIP.some((one) => one[0] === path && one[1] === label)
    )
    .map(({ at }) => at)

const nameOf = ({ label, labelledBy }: Control) => {
  if (label) return label
  const [only] = labelledBy?.labels ?? []

  return labelledBy?.labels.length === 1 && only && !only.other && only.keys.length === 1
    ? `t('${only.keys[0]}')`
    : undefined
}
const notAsTooltip = (list: Control[]) =>
  list.filter((control) => control.tooltip && (!control.says || control.says !== nameOf(control))).map(({ at }) => at)

/*
 * A button drawn as on (`active`), or one whose icon changes with a
 * state, must also say the state. The state is bound, never written once.
 */
const withoutState = (list: Control[]) =>
  list
    .filter(
      ({ active, swapsIcon, pressed, expanded }) =>
        (((active && active !== 'false') || swapsIcon) && !pressed && !expanded) ||
        [pressed, expanded].some((state) => state?.startsWith('"'))
    )
    .map(({ at }) => at)

/*
 * The state a control says with its name: `aria-pressed` for on/off, `aria-expanded`
 * for opening and closing a panel or the main menu. Matched by file and name.
 */
const D = '/src/domains/coreDam/'
const STATES: Array<[path: string, label: string, state: 'aria-pressed' | 'aria-expanded']> = [
  [D + 'asset/components/detail/AssetDetailView.vue', "t('coreDam.asset.detail.toggleInfo')", 'aria-expanded'],
  [D + 'asset/components/detail/AssetFileDetailView.vue', "t('coreDam.asset.detail.toggleInfo')", 'aria-expanded'],
  [
    D + 'asset/components/detail/components/AssetDetailDialog.vue',
    "t('coreDam.asset.detail.toggleInfo')",
    'aria-expanded',
  ],
  [
    D + 'asset/components/detail/components/DistributionImagePreviewItem.vue',
    "t('coreDam.asset.list.toggleSelect')",
    'aria-pressed',
  ],
  [
    D + 'asset/components/footer/AssetFooterSelectedFull.vue',
    "t('coreDam.asset.massOperations.title')",
    'aria-expanded',
  ],
  [
    D + 'asset/components/footer/AssetFooterUploadOverlayFull.vue',
    "t('coreDam.asset.massOperations.title')",
    'aria-expanded',
  ],
  [D + 'asset/components/list/components/AssetListItem.vue', "t('coreDam.asset.list.toggleSelect')", 'aria-pressed'],
  [D + 'asset/components/toolbar/AssetToolbarTypeFilters.vue', "t('coreDam.asset.assetType.image')", 'aria-pressed'],
  [D + 'asset/components/toolbar/AssetToolbarTypeFilters.vue', "t('coreDam.asset.assetType.video')", 'aria-pressed'],
  [D + 'asset/components/toolbar/AssetToolbarTypeFilters.vue', "t('coreDam.asset.assetType.audio')", 'aria-pressed'],
  [D + 'asset/components/toolbar/AssetToolbarTypeFilters.vue', "t('coreDam.asset.assetType.document')", 'aria-pressed'],
  [D + 'asset/components/toolbar/AssetToolbarTypeFilters.vue', "t('coreDam.asset.filter.inPodcast')", 'aria-pressed'],
  [
    D + 'externalProvider/components/ExternalProviderAssetDetailDialog.vue',
    "t('coreDam.asset.detail.toggleInfo')",
    'aria-expanded',
  ],
  [
    D + 'externalProvider/components/ExternalProviderAssetListItem.vue',
    "t('coreDam.asset.list.toggleSelect')",
    'aria-pressed',
  ],
  [TOOLBAR_ITEM, 't(item.titleT)', 'aria-pressed'],
  ['/src/domains/system/components/GridViewToggle.vue', "t('coreDam.asset.list.gridView.masonry')", 'aria-pressed'],
  ['/src/domains/system/components/GridViewToggle.vue', "t('coreDam.asset.list.gridView.thumbnail')", 'aria-pressed'],
  ['/src/domains/system/components/GridViewToggle.vue', "t('coreDam.asset.list.gridView.table')", 'aria-pressed'],
  ['/src/domains/system/components/MainWrapper.vue', "t('coreDam.asset.list.filterToggle')", 'aria-expanded'],
  ['/src/domains/system/components/MainWrapper.vue', "t('coreDam.asset.list.infoToggle')", 'aria-expanded'],
  ['/src/layouts/AppLayoutDrawer.vue', "t('system.mainBar.mainMenu')", 'aria-expanded'],
]

describe('icon-only controls of the app', () => {
  const found = (template: string) => controls('x', `<template>${template}</template>`)
  const one = (button: string) => found(button).map(({ at, tooltip }) => ({ at, tooltip }))
  const unnamed = [{ at: 'x:1', tooltip: undefined }]

  it('are told from the buttons with a text, and one with a tooltip from one without', () => {
    expect(one('<VBtn icon><VIcon icon="mdi-cog" /><VTooltip activator="parent">Settings</VTooltip></VBtn>')).toEqual([
      { at: 'x:1', tooltip: '<VTooltip activator="parent">Settings</VTooltip>' },
    ])
    expect(one('<VBtn icon="mdi-cog" />')).toEqual(unnamed)
    expect(one('<VBtn><VIcon icon="mdi-plus" />Add</VBtn>')).toEqual([])
    expect(one('<VBtn text="Add" />')).toEqual([])
  })

  // Vuetify draws the icon that `icon` names and leaves out the `text` of such a button.
  it('are icon-only also with a `text`, when their `icon` names an icon', () => {
    expect(one('<VBtn icon="mdi-plus" text="Add" />')).toEqual(unnamed)
    expect(one('<VBtn :icon="plus" text="Add" />')).toEqual(unnamed)
    // A bare `icon` only shapes the button, so the text shows.
    expect(one('<VBtn icon text="Add" />')).toEqual([])
  })

  it('have for their tooltip only one they are the activator of', () => {
    const bound = [{ at: 'x:1', tooltip: expect.stringContaining('Settings') }]

    expect(one('<VBtn icon><VIcon icon="mdi-cog" /><VTooltip>Settings</VTooltip></VBtn>')).toEqual(unnamed)
    expect(one('<VBtn icon><VIcon icon="mdi-cog" /><VTooltip activator="#another">Settings</VTooltip></VBtn>')).toEqual(
      unnamed
    )
    expect(
      one(
        '<VBtn icon><VIcon icon="mdi-dots" /><VMenu><VBtn>Go<VTooltip activator="parent">Where</VTooltip></VBtn></VMenu></VBtn>'
      )
    ).toEqual(unnamed)
    // An enclosing tooltip belongs to the button only through the activator slot, whose props the button binds.
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

  // Binding something else does not make the button the activator. It must bind what the slot handed out.
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

  // Vuetify hands the icon a click and renders it as `role="button"`. Inside a button it is the button's content.
  it('are also an icon that takes a click outside a button, by a listener or from a menu it opens', () => {
    const kinds = (template: string) => found(template).map(({ kind }) => kind)

    expect(kinds('<VIcon icon="mdi-magnify" @click="search" />')).toEqual(['icon'])
    expect(kinds('<VIcon icon="mdi-magnify" @click.stop="search" />')).toEqual(['icon'])
    expect(
      kinds('<VMenu><template #activator="{ props }"><VIcon v-bind="props" icon="mdi-x" /></template></VMenu>')
    ).toEqual(['icon'])
    expect(
      kinds('<VDialog><template #activator="{ props: open }"><VIcon v-bind="open" icon="mdi-x" /></template></VDialog>')
    ).toEqual(['icon'])
    // A tooltip opens on pointer and focus and hands no click.
    expect(
      kinds('<VTooltip><template #activator="{ props }"><VIcon v-bind="props" icon="mdi-x" /></template></VTooltip>')
    ).toEqual([])
    expect(kinds('<VIcon icon="mdi-magnify" />')).toEqual([])
    expect(kinds('<VBtn icon @click="search"><VIcon icon="mdi-magnify" @click="search" /></VBtn>')).toEqual(['button'])
    // The menu of a button is drawn apart from it, so an icon there is a separate control.
    expect(
      kinds(
        '<VBtn icon><VIcon icon="mdi-dots" /><VMenu activator="parent"><VList><VIcon icon="mdi-x" @click="x" /></VList></VMenu></VBtn>'
      )
    ).toEqual(['button', 'icon'])
  })

  it('are also the hamburger of an app bar, a button of the library, and a list item that shows only icons', () => {
    const kinds = (template: string) => found(template).map(({ kind }) => kind)

    expect(kinds('<VAppBarNavIcon @click="toggle" />')).toEqual(['button'])
    expect(kinds('<VAppBarNavIcon text="Menu" />')).toEqual(['button'])
    expect(kinds('<ABtnTertiary icon="mdi-x" />')).toEqual(['button'])
    expect(kinds('<ABtnIcon><VIcon icon="mdi-x" /></ABtnIcon>')).toEqual(['button'])
    expect(kinds('<ABtnPrimary>Save</ABtnPrimary>')).toEqual([])
    const item = '<VTooltip activator="parent">Home</VTooltip>'
    expect(kinds(`<VListItem :to="home" prepend-icon="mdi-home">${item}</VListItem>`)).toEqual(['listItem'])
    expect(kinds('<VListItem href="/x"><template #prepend><VIcon icon="mdi-x" /></template></VListItem>')).toEqual([
      'listItem',
    ])
    expect(kinds('<VListItem link prepend-icon="mdi-home" />')).toEqual(['listItem'])
    expect(kinds('<VListItem prepend-icon="mdi-home" @click="go" />')).toEqual(['listItem'])
    expect(kinds('<VListItem :to="home" :title="t(\'a.b\')" prepend-icon="mdi-home" />')).toEqual([])
    expect(kinds('<VListItem :to="home" subtitle="Home" />')).toEqual([])
    expect(kinds('<VListItem :to="home"><VListItemTitle>Home</VListItemTitle></VListItem>')).toEqual([])
    expect(kinds('<VListItem prepend-icon="mdi-home" />')).toEqual([])
  })

  // A `title` is not accepted as a name. It is a second, native tooltip next to the Vuetify one.
  it('are named by an `aria-label`, bound or plain, or by an `aria-labelledby`; not by a `title`', () => {
    const names = (template: string) => found(template).map(({ label, labelledBy }) => ({ label, labelledBy }))

    expect(names('<VBtn icon="mdi-x" :aria-label="t(\'a.b\')" />')).toEqual([
      { label: "t('a.b')", labelledBy: undefined },
    ])
    expect(names('<VBtn icon="mdi-x" aria-label="Close" />')).toEqual([{ label: '"Close"', labelledBy: undefined }])
    expect(names('<VBtn icon="mdi-x" title="Close" />')).toEqual([{ label: undefined, labelledBy: undefined }])
    expect(names('<VIcon icon="mdi-x" :aria-label="t(\'a.b\')" @click="go" />')).toEqual([
      { label: "t('a.b')", labelledBy: undefined },
    ])
    expect(names('<VListItem :to="home" prepend-icon="mdi-home" :aria-label="t(\'a.b\')" />')).toEqual([
      { label: "t('a.b')", labelledBy: undefined },
    ])
    expect(names('<VBtn icon="mdi-x" aria-labelledby="nowhere" />')).toEqual([
      { label: undefined, labelledBy: { by: '"nowhere"', labels: [undefined] } },
    ])
  })

  // The text an `aria-labelledby` points at is the name, so it must exist and be in the user's language.
  it('follow an `aria-labelledby` to what it points at in their template', () => {
    const labels = (template: string) => found(template).map(({ labelledBy }) => labelledBy?.labels)

    expect(labels('<span id="a">{{ t(\'x.y\') }}</span><VBtn icon="mdi-x" aria-labelledby="a" />')).toEqual([
      [{ keys: ['x.y'], other: false }],
    ])
    expect(
      labels(
        '<VBtn icon="mdi-x" aria-labelledby="a b" /><b id="b">Close</b><i id="a"><span>{{ t(\'x.y\') }}</span></i>'
      )
    ).toEqual([
      [
        { keys: ['x.y'], other: false },
        { keys: [], other: true },
      ],
    ])
    expect(labels('<span :id="titleId">{{ name }}</span><VBtn icon="mdi-x" :aria-labelledby="titleId" />')).toEqual([
      [{ keys: [], other: true }],
    ])
    expect(
      labels('<span id="titleId">{{ t(\'x.y\') }}</span><VBtn icon="mdi-x" :aria-labelledby="titleId" />')
    ).toEqual([[undefined]])
    // Do not follow into an overlay drawn apart from the control: its tooltip exists only while open.
    expect(
      labels(
        '<VBtn icon="mdi-x" aria-labelledby="a"><VTooltip activator="parent"><span id="a">{{ t(\'x.y\') }}</span></VTooltip></VBtn>'
      )
    ).toEqual([[undefined]])
    // Within the same overlay it is followed, because both are drawn together.
    expect(
      labels(
        '<VDialog><VCard><b id="a">{{ t(\'x.y\') }}</b><VBtn icon="mdi-x" aria-labelledby="a" /></VCard></VDialog>'
      )
    ).toEqual([[{ keys: ['x.y'], other: false }]])
  })

  it('compare a name, also one by an `aria-labelledby`, with all their tooltip says', () => {
    const tip = (said: string) => `<VTooltip activator="parent">${said}</VTooltip>`
    const differ = (template: string) => notAsTooltip(found(template))

    expect(differ(`<VBtn icon="mdi-x" :aria-label="t('a.b')">${tip("{{ t('a.b') }}")}</VBtn>`)).toEqual([])
    expect(
      differ(`<VBtn icon="mdi-x" :aria-label="t('a.b')"><VTooltip activator="parent" :text="t('a.b')" /></VBtn>`)
    ).toEqual([])
    expect(differ(`<VBtn icon="mdi-x" :aria-label="t('a.b')">${tip("{{ t('a.b') }}: {{ count }}")}</VBtn>`)).toEqual([
      'x:1',
    ])
    expect(differ(`<VBtn icon="mdi-x" :aria-label="t('a.b')">${tip("Close {{ t('a.b') }}")}</VBtn>`)).toEqual(['x:1'])
    expect(differ(`<VBtn icon="mdi-x" :aria-label="t('a.b')">${tip("{{ t('c.d') }}")}</VBtn>`)).toEqual(['x:1'])
    const labelled = (key: string) =>
      `<span id="n">{{ t('a.b') }}</span><VBtn icon="mdi-x" aria-labelledby="n">${tip(`{{ t('${key}') }}`)}</VBtn>`
    expect(differ(labelled('a.b'))).toEqual([])
    expect(differ(labelled('c.d'))).toEqual(['x:1'])
  })

  it('let go without a tooltip only the two named controls, not the rest of their files', () => {
    const hamburger = `<VAppBarNavIcon :aria-label="t('system.mainBar.mainMenu')" />`
    const other = `<VBtn icon="mdi-x" :aria-label="t('a.b')" />`

    expect(
      withoutTooltip(controls('/src/layouts/AppLayoutDrawer.vue', `<template>${hamburger}${other}</template>`))
    ).toEqual(['/src/layouts/AppLayoutDrawer.vue:1'])
    expect(withoutTooltip(controls('/src/x.vue', `<template>${hamburger}</template>`))).toEqual(['/src/x.vue:1'])
  })

  // The guard reads only plain keys. A bound key or one in camel case stays unchecked.
  it('read the keys a prop is given only where it is written plain, and tell where it is not', () => {
    const given = givenTo('AssetFileRouteChangeBtn', 'button-t', {
      '/x.vue': `<template>
        <AssetFileRouteChangeBtn button-t="a.b" />
        <AssetFileRouteChangeBtn :button-t="key" />
        <AssetFileRouteChangeBtn buttonT="c.d" />
        <AssetFileRouteChangeBtn :buttonT="key" />
        <OtherButton button-t="e.f" />
      </template>`,
    })

    expect(given).toEqual({ values: ['a.b'], unread: ['/x.vue:3', '/x.vue:4', '/x.vue:5'] })
  })

  it('tell a toggle by its icon that changes with it, as well as by `active`', () => {
    const stateless = (template: string) => withoutState(found(template))
    const icons = '<VIcon v-if="on" icon="mdi-checkbox-outline" /><VIcon v-else icon="mdi-checkbox-blank-outline" />'

    expect(stateless(`<VBtn icon @click="toggle">${icons}</VBtn>`)).toEqual(['x:1'])
    expect(stateless(`<VBtn icon :aria-pressed="on" @click="toggle">${icons}</VBtn>`)).toEqual([])
    expect(stateless(`<VBtn :icon="on ? 'mdi-eye' : 'mdi-eye-off'" @click="toggle" />`)).toEqual(['x:1'])
    expect(stateless(`<VBtn icon @click="toggle"><VIcon :icon="on ? 'mdi-eye' : 'mdi-eye-off'" /></VBtn>`)).toEqual([
      'x:1',
    ])
    expect(stateless('<VBtn icon :active="on" @click="toggle"><VIcon icon="mdi-x" /></VBtn>')).toEqual(['x:1'])
    expect(stateless('<VBtn icon :active="on" aria-pressed="true"><VIcon icon="mdi-x" /></VBtn>')).toEqual(['x:1'])
    expect(stateless('<VBtn icon><VIcon v-if="on" icon="mdi-x" /></VBtn>')).toEqual([])
    expect(stateless('<VBtn :icon="item.icon" />')).toEqual([])
    expect(stateless('<VBtn :icon="item?.icon ?? \'mdi-x\'" />')).toEqual([])
  })

  it('are found in the templates of the app, of each kind', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100)
    expect(all.length).toBeGreaterThan(80)
    expect([...new Set(all.map(({ kind }) => kind))].sort()).toEqual(['button', 'icon', 'listItem'])
  })

  it('all have a tooltip', () => {
    expect(withoutTooltip(all)).toEqual([])
  })

  // A tooltip exists even when its translation is missing. Then it would show the key.
  it.each(['sk', 'en'] as const)('say in their tooltips texts the app has in %s', (locale) => {
    const said = all.flatMap((control) =>
      Array.from(control.tooltip?.matchAll(/\bt\('([^']+)'/g) ?? [], (match) => ({ at: control.at, key: match[1] }))
    )

    expect(said.length).toBeGreaterThan(50)
    expect(said.filter(({ key }) => !text(key!, locale)?.trim() || text(key!, locale) === key)).toEqual([])
  })

  it('all have an accessible name', () => {
    expect(all.filter((control) => !control.label && !control.labelledBy).map(({ at }) => at)).toEqual([])
  })

  // An `aria-label` exists even when its translation is missing. Then the
  // control is named by the key. A plain one says the same in every language.
  it.each(['sk', 'en'] as const)('are named by a text the app has in %s', (locale) => {
    const named = all
      .filter((control) => control.label && !DYNAMIC[control.path])
      .map((control) => {
        const key = control.label?.match(KEY_LABEL)?.[1]

        return { at: control.at, label: control.label, key, text: key ? text(key, locale) : undefined }
      })

    expect(named.length).toBeGreaterThan(80)
    expect(named.filter((control) => !control.text?.trim() || control.text === control.key)).toEqual([])
  })

  it('are named by a key they do not spell out only where it is listed, and each key it can take has its texts', () => {
    const dynamic = all.filter(
      (control) => control.label && !control.label.startsWith('"') && !KEY_LABEL.test(control.label)
    )
    const keys = Object.values(DYNAMIC).flatMap(({ keys }) => keys())

    expect(dynamic.map(({ path, label }) => [path, label]).sort()).toEqual(
      Object.entries(DYNAMIC)
        .map(([path, { label }]) => [path, label])
        .sort()
    )
    expect(keys.length).toBeGreaterThan(6)
    expect(untranslated(keys)).toEqual([])
    expect(givenTo('AssetFileRouteChangeBtn', 'button-t').unread).toEqual([])
  })

  it('are named by all their tooltip says', () => {
    expect(notAsTooltip(all)).toEqual([])
  })

  it('point an `aria-labelledby` only at a text of the app in their template', () => {
    const wrong = all.filter(
      ({ labelledBy }) =>
        labelledBy &&
        !labelledBy.labels.every(
          (label) => label && !label.other && label.keys.length && !untranslated(label.keys).length
        )
    )

    expect(wrong.map(({ at }) => at)).toEqual([])
  })

  it('say whether they are on, or whether what they open is open', () => {
    const states = all.flatMap(({ path, label, pressed, expanded }) => [
      ...(pressed ? [[path, label, 'aria-pressed']] : []),
      ...(expanded ? [[path, label, 'aria-expanded']] : []),
    ])

    expect(states.sort()).toEqual([...STATES].sort())
    expect(withoutState(all)).toEqual([])
    expect(all.filter(({ swapsIcon }) => swapsIcon).length).toBe(3)
  })
})
