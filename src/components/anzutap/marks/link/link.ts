import { Mark, markPasteRule, mergeAttributes, type PasteRuleMatch } from '@tiptap/core'
import { Plugin, Transaction } from '@tiptap/pm/state'
import { find, registerCustomProtocol, reset } from 'linkifyjs'
import { autolink } from '@/components/anzutap/marks/link/helpers/autolink'
import { clickHandler } from '@/components/anzutap/marks/link/helpers/clickHandler'
import { pasteHandler } from '@/components/anzutap/marks/link/helpers/pasteHandler'
import type { LinkVariantType } from '@/components/anzutap/marks/link/composables/LinkVariant'
import { isValidLinkVariant } from '@/components/anzutap/marks/link/helpers/linkVariantValidation'
import { getLinkMarkAttributesFromHref, getVariantFromHref } from '@/components/anzutap/marks/link/helpers/linkAttrs'
import { MarkName } from '@/components/anzutap/marks/marks'
import { type Ref, ref } from 'vue'
import { isUndefined } from '@anzusystems/common-admin'
import { NodeName } from '@/components/anzutap/nodes/nodes'
import { useLink } from '@/components/anzutap/marks/link/composables/useLink'

// source: https://github.com/ueberdosis/tiptap/tree/main/packages/extension-link

export interface LinkProtocolOptions {
  /**
   * The protocol scheme to be registered.
   * @default '''
   * @example 'ftp'
   * @example 'git'
   */
  scheme: string

  /**
   * If enabled, it allows optional slashes after the protocol.
   * @default false
   * @example true
   */
  optionalSlashes?: boolean
}

export interface LinkInternal {
  type: string
  id: string
}

export const pasteRegex =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)/gi

export interface LinkOptions {
  /**
   * If enabled, the extension will automatically add links as you type.
   * @default true
   * @example false
   */
  autolink: boolean

  /**
   * An array of custom protocols to be registered with linkifyjs.
   * @default []
   * @example ['ftp', 'git']
   */
  protocols: Array<LinkProtocolOptions | string>

  /**
   * Default protocol to use when no protocol is specified.
   * @default 'http'
   */
  defaultProtocol: string
  /**
   * If enabled, links will be opened on click.
   * @default true
   * @example false
   */
  openOnClick: boolean
  /**
   * Adds a link to the current selection if the pasted content only contains an url.
   * @default true
   * @example false
   */
  linkOnPaste: boolean

  /**
   * HTML attributes to add to the link element.
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, string | number | boolean | null | undefined>

  /**
   * A validation function which is used for configuring link verification for preventing XSS attacks.
   * Only modify this if you know what you're doing.
   *
   * @returns {boolean} `true` if the URL is valid, `false` otherwise.
   *
   * @example
   * isAllowedUri: (url, { defaultValidate, protocols, defaultProtocol }) => {
   * return url.startsWith('./') || defaultValidate(url)
   * }
   */
  isAllowedUri: (
    /**
     * The URL to be validated.
     */
    url: string,
    ctx: {
      /**
       * The default validation function.
       */
      defaultValidate: (url: string) => boolean
      /**
       * An array of allowed protocols for the URL (e.g., "http", "https"). As defined in the `protocols` option.
       */
      protocols: Array<LinkProtocolOptions | string>
      /**
       * A string that represents the default protocol (e.g., 'http'). As defined in the `defaultProtocol` option.
       */
      defaultProtocol: string
    }
  ) => boolean

  /**
   * Determines whether a valid link should be automatically linked in the content.
   *
   * @param {string} url - The URL that has already been validated.
   * @returns {boolean} - True if the link should be auto-linked; false if it should not be auto-linked.
   */
  shouldAutoLink: (url: string) => boolean

  nofollowEnabled: boolean
  nofollowDisabledText: string
}

export interface LinkStorage {
  dialog: Ref<boolean>
  nofollowEnabled: boolean
  nofollowDisabledText: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    link: {
      /**
       * Add a text with link
       */
      addLink: (
        text: string,
        attributes: {
          href: string
          external: boolean
          nofollow: boolean
          variant: LinkVariantType
          internal: null | LinkInternal
        }
      ) => ReturnType
      /**
       * Set a link mark
       */
      setLink: (attributes: {
        href: string
        external: boolean
        nofollow: boolean
        variant: LinkVariantType
        internal: null | LinkInternal
      }) => ReturnType
      /**
       * Toggle a link mark
       */
      toggleLink: (attributes: {
        href: string
        external: boolean
        nofollow: boolean
        variant: LinkVariantType
        internal: null | LinkInternal
      }) => ReturnType
      /**
       * Unset a link mark
       */
      unsetLink: () => ReturnType
      /**
       * Unset a link mark or toggle a link mark, depending on cursor position
       */
      unsetOrToggleOffLink: () => ReturnType
    }
  }
}

// From DOMPurify
// https://github.com/cure53/DOMPurify/blob/main/src/regexp.js

const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g

export function isAllowedUri(uri: string | undefined, protocols?: LinkOptions['protocols']) {
  const allowedProtocols: string[] = ['http', 'https', 'ftp', 'ftps', 'mailto', 'tel', 'callto', 'sms', 'cid', 'xmpp']

  if (protocols) {
    protocols.forEach((protocol) => {
      const nextProtocol = typeof protocol === 'string' ? protocol : protocol.scheme

      if (nextProtocol) {
        allowedProtocols.push(nextProtocol)
      }
    })
  }

  return (
    !uri ||
    uri
      .replace(ATTR_WHITESPACE, '')
      .match(new RegExp(`^(?:(?:${allowedProtocols.join('|')}):|[^a-z]|[a-z0-9+.\-]+(?:[^a-z+.\-:]|$))`, 'i'))
  )
}

/**
 * This extension allows you to create links.
 * @see https://www.tiptap.dev/api/marks/link
 */
export const Link = Mark.create<LinkOptions, LinkStorage>({
  name: MarkName.Link,

  priority: 1000,

  keepOnSplit: false,

  exitable: true,

  onCreate() {
    this.options.protocols.forEach((protocol) => {
      if (typeof protocol === 'string') {
        registerCustomProtocol(protocol)
        return
      }
      registerCustomProtocol(protocol.scheme, protocol.optionalSlashes)
    })
  },

  onDestroy() {
    reset()
  },

  inclusive() {
    return this.options.autolink
  },

  addOptions() {
    return {
      openOnClick: true,
      linkOnPaste: true,
      autolink: true,
      protocols: [],
      defaultProtocol: 'http',
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
        class: null,
      },
      nofollowEnabled: true,
      nofollowDisabledText: '',
      isAllowedUri: (url, ctx) => !!isAllowedUri(url, ctx.protocols),
      shouldAutoLink: (url) => !!url,
    }
  },

  addStorage() {
    return {
      dialog: ref<boolean>(false),
      nofollowEnabled: this.options.nofollowEnabled,
      nofollowDisabledText: this.options.nofollowDisabledText,
    }
  },

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (element) => element.getAttribute('href'),
        renderHTML: (attributes) => {
          return {
            href: attributes.href,
          }
        },
      },
      external: {
        default: true,
        parseHTML: (element) => Boolean(element.getAttribute('data-external')),
        renderHTML: (attributes) => {
          return {
            'data-external': attributes.external,
          }
        },
      },
      internal: {
        default: null,
        parseHTML: (element) => {
          const type = element.getAttribute('data-internal-type')
          const id = element.getAttribute('data-internal-id')
          if (type && id) {
            return {
              type: element.getAttribute('data-internal-type'),
              id: element.getAttribute('data-internal-id'),
            }
          }
          return null
        },
        renderHTML: (attributes) => {
          return attributes.internal
            ? {
                'data-internal-type': attributes.internal.type,
                'data-internal-id': attributes.internal.id,
              }
            : {}
        },
      },
      nofollow: {
        default: false,
        parseHTML: (element) => Boolean(element.getAttribute('data-nofollow')),
        renderHTML: (attributes) => {
          return {
            'data-nofollow': attributes.nofollow,
          }
        },
      },
      variant: {
        default: 'link',
        parseHTML: (element) => {
          const variantAttr = element.getAttribute('data-variant')
          const href = element.getAttribute('href')
          if (isValidLinkVariant(variantAttr)) {
            return variantAttr
          }
          return getVariantFromHref(href)
        },
        renderHTML: (attributes) => {
          return {
            'data-variant': attributes.variant,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[href]',
        getAttrs: (dom) => {
          const href = (dom as HTMLElement).getAttribute('href')

          // prevent XSS attacks
          if (
            !href ||
            !this.options.isAllowedUri(href, {
              defaultValidate: (url) => !!isAllowedUri(url, this.options.protocols),
              protocols: this.options.protocols,
              defaultProtocol: this.options.defaultProtocol,
            })
          ) {
            return false
          }
          return null
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // prevent XSS attacks
    if (
      !this.options.isAllowedUri(HTMLAttributes.href, {
        defaultValidate: (href) => !!isAllowedUri(href, this.options.protocols),
        protocols: this.options.protocols,
        defaultProtocol: this.options.defaultProtocol,
      })
    ) {
      // strip out the href
      return ['a', mergeAttributes(this.options.HTMLAttributes, { ...HTMLAttributes, href: '' }), 0]
    }

    return ['a', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addKeyboardShortcuts() {
    return {
      'Control-k': () => {
        const { openDialog } = useLink(this.editor)
        openDialog()
        return true
      },
    }
  },

  addCommands() {
    return {
      setLink:
        (attributes) =>
        ({ chain }) => {
          const { href } = attributes

          if (
            !this.options.isAllowedUri(href, {
              defaultValidate: (url) => !!isAllowedUri(url, this.options.protocols),
              protocols: this.options.protocols,
              defaultProtocol: this.options.defaultProtocol,
            })
          ) {
            return false
          }

          return chain().setMark(this.name, attributes).setMeta('preventAutolink', true).run()
        },

      addLink:
        (text, attributes) =>
        ({ dispatch, tr, state }) => {
          const { $from, $to } = tr.selection
          if (!$from.parent || isUndefined(dispatch)) return false

          const isInsideParagraph = $from.parent.type.name === NodeName.Paragraph
          const isInsideHeading = $from.parent.type.name === NodeName.Heading

          const insertTextWithLinkMark = (tr: Transaction, text: string) => {
            // Check if there's space before and after the text
            const spaceBefore = $from.nodeBefore && $from.nodeBefore.text?.slice(-1) !== ' ' ? ' ' : ''
            const spaceAfter = $to.nodeAfter && $to.nodeAfter.text?.slice(0, 1) !== ' ' ? ' ' : ''

            tr.insertText(`${spaceBefore}${text}${spaceAfter}`, $from.pos, $to.pos)
            tr.addMark(
              $from.pos + spaceBefore.length,
              $to.pos + text.length + spaceBefore.length,
              state.schema.marks[MarkName.Link].create(attributes)
            )
          }

          if (isInsideParagraph || isInsideHeading) {
            insertTextWithLinkMark(tr, text)
            tr.setMeta('preventAutolink', true)
            dispatch(tr)
            return true
          }
          const newNode = state.schema.nodes[NodeName.Paragraph].create(
            null,
            state.schema.text(text, [state.schema.marks.link.create(attributes)])
          )
          tr.replaceSelectionWith(newNode)
          tr.setMeta('preventAutolink', true)
          dispatch(tr)
          return true
        },

      toggleLink:
        (attributes) =>
        ({ chain }) => {
          const { href } = attributes

          if (
            !this.options.isAllowedUri(href, {
              defaultValidate: (url) => !!isAllowedUri(url, this.options.protocols),
              protocols: this.options.protocols,
              defaultProtocol: this.options.defaultProtocol,
            })
          ) {
            return false
          }

          return chain()
            .toggleMark(this.name, attributes, { extendEmptyMarkRange: true })
            .setMeta('preventAutolink', true)
            .run()
        },

      unsetLink:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name, { extendEmptyMarkRange: true }).setMeta('preventAutolink', true).run()
        },
      unsetOrToggleOffLink:
        () =>
        ({ chain, tr, state }) => {
          const selection = tr.selection
          const cursorPos = selection.from
          const linkMark = selection.$from.marks().find((mark) => mark.type === state.schema.marks.link)
          if (!linkMark) return false

          const linkStart = selection.$from.start()
          const selectionNode = selection.$from.node()
          const linkEnd = linkStart + selectionNode.content.size
          if (cursorPos === linkEnd) {
            return chain().unsetMark(this.name).setMeta('preventAutolink', true).run()
          }
          return chain().unsetMark(this.name, { extendEmptyMarkRange: true }).setMeta('preventAutolink', true).run()
        },
    }
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: (text) => {
          const foundLinks: PasteRuleMatch[] = []

          if (text) {
            const { protocols, defaultProtocol } = this.options
            const links = find(text).filter(
              (item) =>
                item.isLink &&
                this.options.isAllowedUri(item.value, {
                  defaultValidate: (href) => !!isAllowedUri(href, protocols),
                  protocols,
                  defaultProtocol,
                })
            )

            if (links.length) {
              links.forEach((link) =>
                foundLinks.push({
                  text: link.value,
                  data: getLinkMarkAttributesFromHref(link.href),
                  index: link.start,
                })
              )
            }
          }

          return foundLinks
        },
        type: this.type,
        getAttributes: (match) => {
          return {
            href: match.data?.href,
            variant: match.data?.variant,
            external: match.data?.external,
            nofollow: match.data?.nofollow,
          }
        },
      }),
    ]
  },

  addProseMirrorPlugins() {
    const plugins: Plugin[] = []
    const { protocols, defaultProtocol } = this.options

    if (this.options.autolink) {
      plugins.push(
        autolink({
          type: this.type,
          defaultProtocol: this.options.defaultProtocol,
          validate: (url) =>
            this.options.isAllowedUri(url, {
              defaultValidate: (href) => !!isAllowedUri(href, protocols),
              protocols,
              defaultProtocol,
            }),
          shouldAutoLink: this.options.shouldAutoLink,
        })
      )
    }

    if (this.options.openOnClick === true) {
      plugins.push(
        clickHandler({
          type: this.type,
        })
      )
    }

    if (this.options.linkOnPaste) {
      plugins.push(
        pasteHandler({
          editor: this.editor,
          defaultProtocol: this.options.defaultProtocol,
          type: this.type,
        })
      )
    }

    return plugins
  },
})

export default Link
