import { isString, isUndefined } from '@anzusystems/common-admin'
import type { Editor } from '@tiptap/core'
import { computed, reactive, ref } from 'vue'
import { LinkVariantDefault, type LinkVariantType } from '@/components/anzutap/marks/link/composables/LinkVariant.ts'
import { validateLinkVariant } from '@/components/anzutap/marks/link/helpers/linkVariantValidation'
import { MarkName } from '@/components/anzutap/marks/marks'
import { isTextSelected } from '@/components/anzutap/utils/pm-utils'
import type { LinkInternal } from '@/components/anzutap/marks/link/link.ts'

export interface LinkDialogData {
  text: string
  href: string
  variant: LinkVariantType
  external: boolean
  internal: LinkInternal | null
  nofollow: boolean
}

const insertMode = ref(false)
const currentLink = reactive<LinkDialogData>({
  text: '',
  href: '',
  variant: LinkVariantDefault,
  external: false,
  internal: null,
  nofollow: false,
})

export function useLink(editor: Editor | undefined) {
  const dialog = computed({
    get(): boolean {
      return editor?.storage.link?.dialog.value || false
    },
    set(newValue: boolean) {
      if (editor) editor.storage.link.dialog.value = newValue
    },
  })

  const updateLinkFromState = async () => {
    if (isUndefined(editor)) return
    currentLink.href = currentLink.href.trim()

    if (insertMode.value) {
      editor
        .chain()
        .focus()
        .addLink(currentLink.text, {
          href: currentLink.href,
          external: currentLink.external,
          nofollow: currentLink.nofollow,
          variant: currentLink.variant,
          internal: currentLink.internal,
        })
        .run()

      return
    }

    editor
      .chain()
      .focus()
      .extendMarkRange(MarkName.Link)
      .setLink({
        href: currentLink.href,
        external: currentLink.external,
        nofollow: currentLink.nofollow,
        variant: currentLink.variant,
        internal: currentLink.internal,
      })
      .run()
  }

  const openDialog = () => {
    if (isUndefined(editor)) return
    getLinkData()
    dialog.value = true
  }

  const getLinkData = () => {
    if (isUndefined(editor)) return
    insertMode.value = false
    currentLink.text = ''
    if (!editor.isActive(MarkName.Link) && !isTextSelected(editor.state)) {
      insertMode.value = true
    }
    const link = editor.getAttributes(MarkName.Link).href
    const external = Boolean(editor.getAttributes(MarkName.Link).external)
    const nofollow = Boolean(editor.getAttributes(MarkName.Link).nofollow)
    const variant = editor.getAttributes(MarkName.Link).variant
    currentLink.href = isString(link) ? link : ''
    currentLink.external = external
    currentLink.nofollow = nofollow
    currentLink.internal = editor.getAttributes(MarkName.Link).internal
    currentLink.variant = validateLinkVariant(variant, LinkVariantDefault)
  }

  return {
    currentLink,
    dialog,
    insertMode,
    updateLinkFromState,
    openDialog,
  }
}
