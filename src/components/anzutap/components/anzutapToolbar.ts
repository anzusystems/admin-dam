import type { Editor } from '@tiptap/core'
import { isDefined } from '@anzusystems/common-admin'
import type { EditorStorageWithLink } from '@/components/anzutap/types/storage'

export interface ToolbarItemButton {
  id: string
  type: 'button'
  icon: string
  command: () => void | boolean
  show: () => boolean
  active: () => boolean | undefined
  titleT: string
}

export interface ToolbarItemSeparator {
  id: string
  type: 'separator'
}

export function useAnzutapToolbar(editor: Editor | undefined) {
  const openLinkDialog = () => {
    if (!editor) return
    const storage = editor.storage as EditorStorageWithLink
    if (!storage.link) return
    storage.link.dialog.value = true
  }

  const itemsRow1: Array<ToolbarItemButton | ToolbarItemSeparator> = [
    {
      id: 'textBold',
      type: 'button',
      icon: 'mdi-format-bold',
      titleT: 'Bold',
      command: () => editor?.chain().focus().toggleBold().run(),
      show: () => isDefined(editor?.extensionManager.schema.marks.bold),
      active: () => editor?.isActive('bold'),
    },
    {
      id: 'textItalic',
      type: 'button',
      icon: 'mdi-format-italic',
      titleT: 'Italic',
      command: () => editor?.chain().focus().toggleItalic().run(),
      show: () => isDefined(editor?.extensionManager.schema.marks.italic),
      active: () => editor?.isActive('italic'),
    },
    {
      id: 'textUnderline',
      type: 'button',
      icon: 'mdi-format-underline',
      titleT: 'Underline',
      command: () => editor?.chain().focus().toggleUnderline().run(),
      show: () => isDefined(editor?.extensionManager.schema.marks.underline),
      active: () => editor?.isActive('underline'),
    },
    {
      id: 'sep1',
      type: 'separator',
    },
    {
      id: 'openLink',
      type: 'button',
      icon: 'mdi-link',
      titleT: 'Link',
      command: () => openLinkDialog(),
      show: () => isDefined(editor?.extensionManager.schema.marks.link),
      active: () => editor?.isActive('link'),
    },
    {
      id: 'removeLink',
      type: 'button',
      icon: 'mdi-link-off',
      titleT: 'Remove link',
      command: () => editor?.chain().focus().extendMarkRange('link').unsetLink().run(),
      show: () => isDefined(editor?.extensionManager.schema.marks.link) && !!editor?.isActive('link'),
      active: () => false,
    },
  ]

  return {
    itemsRow1,
  }
}
