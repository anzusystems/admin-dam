import { isDefined } from '@anzusystems/common-admin'
import type { Editor } from '@tiptap/core'

import { useLink } from '@/domains/coreDam/shared/components/anzutap/marks/link/composables/useLink'

export interface ToolbarItemButton {
  id: string
  type: 'button'
  icon: string
  command: () => void | boolean
  show: () => boolean
  active: () => boolean | undefined
  titleT: string
  /** A toggled mark: the button shows whether it is active. */
  toggle?: boolean
}

export interface ToolbarItemSeparator {
  id: string
  type: 'separator'
}

export function useAnzutapToolbar(editor: Editor | undefined) {
  const { openDialog: openLinkDialog } = useLink(editor)

  const itemsRow1: Array<ToolbarItemButton | ToolbarItemSeparator> = [
    {
      id: 'textBold',
      type: 'button',
      icon: 'mdi-format-bold',
      titleT: 'system.editor.bold',
      command: () => editor?.chain().focus().toggleBold().run(),
      show: () => isDefined(editor?.extensionManager.schema.marks.bold),
      active: () => editor?.isActive('bold'),
      toggle: true,
    },
    {
      id: 'textItalic',
      type: 'button',
      icon: 'mdi-format-italic',
      titleT: 'system.editor.italic',
      command: () => editor?.chain().focus().toggleItalic().run(),
      show: () => isDefined(editor?.extensionManager.schema.marks.italic),
      active: () => editor?.isActive('italic'),
      toggle: true,
    },
    {
      id: 'textUnderline',
      type: 'button',
      icon: 'mdi-format-underline',
      titleT: 'system.editor.underline',
      command: () => editor?.chain().focus().toggleUnderline().run(),
      show: () => isDefined(editor?.extensionManager.schema.marks.underline),
      active: () => editor?.isActive('underline'),
      toggle: true,
    },
    {
      id: 'sep1',
      type: 'separator',
    },
    {
      id: 'openLink',
      type: 'button',
      icon: 'mdi-link',
      titleT: 'system.editor.link',
      command: () => openLinkDialog(),
      show: () => isDefined(editor?.extensionManager.schema.marks.link),
      active: () => editor?.isActive('link'),
    },
    {
      id: 'removeLink',
      type: 'button',
      icon: 'mdi-link-off',
      titleT: 'system.editor.removeLink',
      command: () => editor?.chain().focus().extendMarkRange('link').unsetLink().run(),
      show: () => isDefined(editor?.extensionManager.schema.marks.link) && !!editor?.isActive('link'),
      active: () => false,
    },
  ]

  return {
    itemsRow1,
  }
}
