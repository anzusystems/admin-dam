import { describe, expect, it } from 'vitest'
import { parse } from 'vue/compiler-sfc'
import type { SFCTemplateBlock } from 'vue/compiler-sfc'

import en from '@/locales/en'
import sk from '@/locales/sk'
import { i18n } from '@/plugins/i18n'

/* The icon-only buttons of the upload queue have an accessible name. A tooltip is not one: it gives
 * `aria-describedby`, is rendered only on hover and is hidden on touch devices. The row, the list and the mass
 * operations of the queue are the library's, which guards them the same way (`src/test/a11y/iconButtonNames.test.ts`
 * there); what admin-dam wraps them in is read here, and has no icon-only button of its own today: the delete of a
 * row is the library's `AActionDeleteButton`. The rest of this app is not covered yet. */

const sources = import.meta.glob(
  [
    '/src/domains/coreDam/asset/components/queue/AssetQueueItemEditable.vue',
    '/src/domains/coreDam/asset/components/queue/AssetQueueEditable.vue',
    '/src/domains/coreDam/asset/components/queue/AssetQueueSelectedSidebar.vue',
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

type TemplateChildNode = NonNullable<SFCTemplateBlock['ast']>['children'][number]
type ElementNode = Extract<TemplateChildNode, { tag: string }>

// `NodeTypes` is a const enum of a package this app does not depend on directly.
const NodeTypes = { ELEMENT: 1, TEXT: 2, COMMENT: 3, SIMPLE_EXPRESSION: 4, ATTRIBUTE: 6, DIRECTIVE: 7 } as const

// Rendered elsewhere (overlays) or not text: they do not name the button they sit in.
const NOT_CONTENT = new Set(['VTooltip', 'VMenu', 'VDialog', 'VIcon'])

const isElement = (node: TemplateChildNode): node is ElementNode => node.type === NodeTypes.ELEMENT

/** What the button is named by: the expression of a bound `aria-label`, the text of a plain one. */
const ariaLabel = (el: ElementNode): string | undefined => {
  for (const prop of el.props) {
    if (prop.type === NodeTypes.ATTRIBUTE && prop.name === 'aria-label') return prop.value?.content
    if (
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'bind' &&
      prop.arg?.type === NodeTypes.SIMPLE_EXPRESSION &&
      prop.arg.content === 'aria-label' &&
      prop.exp?.type === NodeTypes.SIMPLE_EXPRESSION
    ) {
      return prop.exp.content
    }
  }

  return undefined
}

// What the button shows as its own content, overlays and icons left out.
const content = (children: TemplateChildNode[]): TemplateChildNode[] =>
  children.flatMap((child) => {
    if (child.type === NodeTypes.COMMENT) return []
    if (child.type === NodeTypes.TEXT) return child.content.trim() ? [child] : []
    if (isElement(child) && NOT_CONTENT.has(child.tag)) return []
    if (isElement(child) && child.tag === 'template') return content(child.children)
    return [child]
  })

interface IconButton {
  at: string
  label: string | undefined
}

const iconButtons = (path: string, source: string): IconButton[] => {
  const found: IconButton[] = []
  const visit = (nodes: TemplateChildNode[]) => {
    for (const node of nodes) {
      if (!isElement(node)) continue
      if (node.tag === 'VBtn' && content(node.children).length === 0) {
        found.push({ at: `${path}:${node.loc.start.line}`, label: ariaLabel(node) })
      }
      visit(node.children)
    }
  }
  visit(parse(source).descriptor.template?.ast?.children ?? [])

  return found
}

const buttons = Object.entries(sources).flatMap(([path, source]) => iconButtons(path, source))

// The app's own messages, the library's `common.*` among them.
i18n.global.setLocaleMessage('sk', sk)
i18n.global.setLocaleMessage('en', en as never)
const text = (key: string, locale: 'sk' | 'en') =>
  i18n.global.te(key, locale) ? i18n.global.t(key, {}, { locale }) : undefined

describe('icon-only buttons of the upload queue', () => {
  it('are looked for in the three wrappers of the queue, which have none of their own', () => {
    expect(Object.keys(sources)).toHaveLength(3)
    expect(buttons).toHaveLength(0)
  })

  it('tells an unnamed one from a named one, and a button with a text from both', () => {
    const template = (button: string) => `<template>${button}</template>`

    expect(
      iconButtons('x', template('<VBtn icon><VIcon icon="mdi-cog" /><VTooltip>Settings</VTooltip></VBtn>'))
    ).toEqual([{ at: 'x:1', label: undefined }])
    expect(iconButtons('x', template('<VBtn icon :aria-label="t(\'a.b\')"><VIcon icon="mdi-cog" /></VBtn>'))).toEqual([
      { at: 'x:1', label: "t('a.b')" },
    ])
    expect(iconButtons('x', template('<VBtn><VIcon icon="mdi-plus" />Add</VBtn>'))).toEqual([])
  })

  it('all have an accessible name', () => {
    expect(buttons.filter((button) => !button.label).map((button) => button.at)).toEqual([])
  })

  // An `aria-label` is there even when its translation is not: then the button would be named by the key.
  it.each(['sk', 'en'] as const)('are named by a text the app has in %s', (locale) => {
    const named = buttons.map((button) => {
      const key = button.label?.match(/^t\('([^']+)'\)$/)?.[1]

      return { at: button.at, key, text: key ? text(key, locale) : undefined }
    })

    expect(named.filter((button) => !button.text?.trim() || button.text === button.key)).toEqual([])
  })

  it('are named by what their tooltip says', () => {
    const tooltips = Object.entries(sources).flatMap(([path, source]) => {
      const pairs: Array<{ at: string; label: string | undefined; tooltip: string }> = []
      const visit = (nodes: TemplateChildNode[]) => {
        for (const node of nodes) {
          if (!isElement(node)) continue
          const tooltip = node.children.find(
            (child): child is ElementNode => isElement(child) && child.tag === 'VTooltip'
          )
          if (node.tag === 'VBtn' && tooltip) {
            pairs.push({
              at: `${path}:${node.loc.start.line}`,
              label: ariaLabel(node),
              tooltip: source.slice(tooltip.loc.start.offset, tooltip.loc.end.offset),
            })
          }
          visit(node.children)
        }
      }
      visit(parse(source).descriptor.template?.ast?.children ?? [])

      return pairs
    })

    expect(tooltips).toHaveLength(0)
    expect(tooltips.filter((pair) => !pair.label || !pair.tooltip.includes(`{{ ${pair.label} }}`))).toEqual([])
  })
})
