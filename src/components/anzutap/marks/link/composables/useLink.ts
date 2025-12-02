import { isString, isUndefined } from '@anzusystems/common-admin'
import type { Editor } from '@tiptap/core'
import { computed, reactive, ref } from 'vue'

export interface LinkDialogData {
  text: string
  href: string
  variant: 'link' | 'button'
  external: boolean
  internal: string | null
  nofollow: boolean
}

const insertMode = ref(false)
const currentLink = reactive<LinkDialogData>({
  text: '',
  href: '',
  variant: 'link',
  external: false,
  internal: null,
  nofollow: false,
})

const isTextSelected = (editor: Editor): boolean => {
  const { from, to } = editor.state.selection
  return from !== to
}

export function useLink(editor: Editor | undefined | (() => Editor | undefined)) {
  const getEditor = () => (typeof editor === 'function' ? editor() : editor)
  const getLinkData = () => {
    const ed = getEditor()
    if (isUndefined(ed)) return
    insertMode.value = false
    currentLink.text = ''

    if (!ed.isActive('link') && !isTextSelected(ed)) {
      insertMode.value = true
    }

    const attrs = ed.getAttributes('link')

    currentLink.href = isString(attrs.href) ? attrs.href : ''
    currentLink.variant = attrs.variant || 'link'
    currentLink.external = Boolean(attrs.external)
    currentLink.internal = attrs.internal || null
    currentLink.nofollow = Boolean(attrs.nofollow)
  }

  const dialog = computed({
    get(): boolean {
      const ed = getEditor()
      return ed?.storage.link?.dialog.value || false
    },
    set(newValue: boolean) {
      const ed = getEditor()
      if (ed && ed.storage.link) {
        ed.storage.link.dialog.value = newValue
      }
    },
  })

  const updateLinkFromState = async () => {
    const ed = getEditor()
    if (isUndefined(ed)) return
    currentLink.href = currentLink.href.trim()

    const linkAttrs = {
      href: currentLink.href,
      variant: currentLink.variant,
      external: currentLink.external,
      internal: currentLink.internal,
      nofollow: currentLink.nofollow,
    }

    if (insertMode.value) {
      // Insert new link with text
      ed
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: currentLink.text,
          marks: [
            {
              type: 'link',
              attrs: linkAttrs,
            },
          ],
        })
        .run()
      return
    }

    // Update existing link
    ed
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink(linkAttrs)
      .run()
  }

  const openDialog = () => {
    const ed = getEditor()
    if (isUndefined(ed)) return
    dialog.value = true
  }

  return {
    currentLink,
    dialog,
    insertMode,
    updateLinkFromState,
    openDialog,
    getLinkData,
  }
}
