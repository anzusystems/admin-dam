<script lang="ts" setup>
import { cloneDeep } from '@anzusystems/common-admin'
import type { JSONContent } from '@tiptap/core'
import Bold from '@tiptap/extension-bold'
import Document from '@tiptap/extension-document'
import Italic from '@tiptap/extension-italic'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Underline from '@tiptap/extension-underline'
import { Editor } from '@tiptap/vue-3'
import { onMounted, onUnmounted, ref, shallowRef, toRaw, watch } from 'vue'
import type { Ref } from 'vue'

import { checkForEmptyDocument } from '@/domains/coreDam/asset/factory/DocumentFactory'
import AnzutapEditor from '@/domains/coreDam/shared/components/anzutap/components/AnzutapEditor.vue'
import Link from '@/domains/coreDam/shared/components/anzutap/marks/link/link'

const props = withDefaults(
  defineProps<{
    editable?: boolean
    label?: string | undefined
  }>(),
  {
    editable: false,
    label: undefined,
  }
)

const content = defineModel<JSONContent>('modelValue', { required: true })

const initialized = ref(false)
const anzutapEditorComponent = ref<InstanceType<typeof AnzutapEditor> | null>(null)
const editor: Ref<Editor | undefined> = shallowRef(undefined)

// eslint-disable-next-line vue/no-ref-object-reactivity-loss
let contentCloned = cloneDeep(toRaw(content.value))
contentCloned = checkForEmptyDocument(contentCloned)

const init = () => {
  editor.value = new Editor({
    content: contentCloned,
    editable: props.editable,
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    onFocus: () => {
      anzutapEditorComponent.value?.onFocus()
    },
    onBlur: () => {
      anzutapEditorComponent.value?.onBlur()
      content.value = editor.value?.getJSON() ?? {}
    },
    onCreate: () => {
      initialized.value = true
    },
  })
}

watch(
  () => props.editable,
  (newEditable) => {
    if (editor.value) {
      editor.value.setEditable(newEditable)
    }
  }
)

onMounted(() => {
  init()
})

onUnmounted(() => {
  editor.value?.destroy()
})
</script>

<template>
  <AnzutapEditor
    v-if="initialized && editor"
    ref="anzutapEditorComponent"
    :editor="editor"
    :label="label"
    :editable="editable"
  />
</template>
