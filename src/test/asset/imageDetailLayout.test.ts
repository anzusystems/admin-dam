import { describe, expect, it } from 'vitest'
import { parse } from 'vue/compiler-sfc'
import type { SFCTemplateBlock } from 'vue/compiler-sfc'

/* The four details of an image lay out their picture and their panel by the classes of the library's css
 * (`image-detail.scss`): the box that holds both is `dam-image-detail__content`, which puts the picture above the panel
 * in a window narrower than 1145 px, as the library's own detail (`AssetDetailDialogFrame.vue`) does. Narrower than
 * 840 px the button of the info panel shows and hides that picture, and draws an image icon there, as the library's
 * does. Read from the templates. */

const DETAILS = [
  '/src/domains/coreDam/asset/components/detail/AssetDetailView.vue',
  '/src/domains/coreDam/asset/components/detail/AssetFileDetailView.vue',
  '/src/domains/coreDam/asset/components/detail/components/AssetDetailDialog.vue',
  '/src/domains/coreDam/externalProvider/components/ExternalProviderAssetDetailDialog.vue',
]

const sources = import.meta.glob(
  [
    '/src/domains/coreDam/asset/components/detail/AssetDetailView.vue',
    '/src/domains/coreDam/asset/components/detail/AssetFileDetailView.vue',
    '/src/domains/coreDam/asset/components/detail/components/AssetDetailDialog.vue',
    '/src/domains/coreDam/externalProvider/components/ExternalProviderAssetDetailDialog.vue',
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>

type TemplateChildNode = NonNullable<SFCTemplateBlock['ast']>['children'][number]
type ElementNode = Extract<TemplateChildNode, { tag: string }>

// `NodeTypes` is a const enum of a package this app does not depend on directly.
const NodeTypes = { ELEMENT: 1, ATTRIBUTE: 6, DIRECTIVE: 7 } as const

const isElement = (node: TemplateChildNode): node is ElementNode => node.type === NodeTypes.ELEMENT

/** The plain classes of the element. */
const classes = (el: ElementNode) =>
  el.props
    .flatMap((prop) => (prop.type === NodeTypes.ATTRIBUTE && prop.name === 'class' ? [prop.value?.content ?? ''] : []))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean)

/** The classes of every box that holds the picture and the panel of the detail side by side. */
const holders = (source: string) => {
  const found: string[][] = []
  const visit = (nodes: TemplateChildNode[]) => {
    for (const node of nodes) {
      if (!isElement(node)) continue
      const children = node.children.filter(isElement).map(classes)
      if (
        children.some((list) => list.includes('dam-image-detail__left')) &&
        children.some((list) => list.includes('dam-image-detail__sidebar'))
      ) {
        found.push(classes(node))
      }
      visit(node.children)
    }
  }
  visit(parse(source).descriptor.template?.ast?.children ?? [])

  return found
}

/** The icons of the button of the info panel, each with its plain classes. */
const toggleIcons = (source: string) => {
  const found: Array<[string, string[]]> = []
  const visit = (nodes: TemplateChildNode[]) => {
    for (const node of nodes) {
      if (!isElement(node)) continue
      const named = node.props.some(
        (prop) =>
          prop.type === NodeTypes.DIRECTIVE &&
          prop.name === 'bind' &&
          prop.arg?.loc.source === 'aria-label' &&
          prop.exp?.loc.source === "t('coreDam.asset.detail.toggleInfo')"
      )
      if (node.tag === 'VBtn' && named) {
        node.children
          .filter(isElement)
          .filter((child) => child.tag === 'VIcon')
          .forEach((icon) => {
            const name = icon.props.find((prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'icon')
            found.push([name?.type === NodeTypes.ATTRIBUTE ? (name.value?.content ?? '') : '', classes(icon)])
          })
      }
      visit(node.children)
    }
  }
  visit(parse(source).descriptor.template?.ast?.children ?? [])

  return found
}

describe('the details of an image', () => {
  it('are the four read here', () => {
    expect(Object.keys(sources).sort()).toEqual([...DETAILS].sort())
  })

  it.each(DETAILS)('%s holds its picture and its panel in the box of the library for the narrow layout', (path) => {
    expect(holders(sources[path]!)).toEqual([expect.arrayContaining(['dam-image-detail__content'])])
  })

  // Vuetify's `md` begins at 840 px, where the library's rule for the panel begins too.
  it.each(DETAILS)('%s draws the info icon on its info button from 840 px, and an image icon narrower', (path) => {
    expect(toggleIcons(sources[path]!)).toEqual([
      ['mdi-information-outline', ['d-none', 'd-md-flex']],
      ['mdi-image-outline', ['d-flex', 'd-md-none']],
    ])
  })
})
