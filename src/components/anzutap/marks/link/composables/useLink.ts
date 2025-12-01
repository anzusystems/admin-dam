import { isString, isUndefined } from '@anzusystems/common-admin'
import type { Editor } from '@tiptap/core'
import { computed, reactive, ref } from 'vue'

export interface LinkDialogData {
  text: string
  href: string
  nofollow: boolean
}

const insertMode = ref(false)
const currentLink = reactive<LinkDialogData>({
  text: '',
  href: '',
  nofollow: false,
})

const isTextSelected = (editor: Editor): boolean => {
  const { from, to } = editor.state.selection
  return from !== to
}

export function useLink(editor: Editor | undefined) {
  const getLinkData = () => {
    if (isUndefined(editor)) return
    insertMode.value = false
    currentLink.text = ''

    if (!editor.isActive('link') && !isTextSelected(editor)) {
      insertMode.value = true
    }

    const link = editor.getAttributes('link').href
    const nofollow = Boolean(editor.getAttributes('link').nofollow)

    currentLink.href = isString(link) ? link : ''
    currentLink.nofollow = nofollow
  }

  const dialog = computed({
    get(): boolean {
      return editor?.storage.link?.dialog.value || false
    },
    set(newValue: boolean) {
      if (editor) {
        editor.storage.link.dialog.value = newValue
      }
    },
  })

  const updateLinkFromState = async () => {
    if (isUndefined(editor)) return
    currentLink.href = currentLink.href.trim()

    if (insertMode.value) {
      // Insert new link with text
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: currentLink.text,
          marks: [
            {
              type: 'link',
              attrs: {
                href: currentLink.href,
                nofollow: currentLink.nofollow,
              },
            },
          ],
        })
        .run()
      return
    }

    // Update existing link
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: currentLink.href,
        nofollow: currentLink.nofollow,
      })
      .run()
  }

  const openDialog = () => {
    if (isUndefined(editor)) return
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
