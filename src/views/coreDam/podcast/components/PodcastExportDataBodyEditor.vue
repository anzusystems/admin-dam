<script lang="ts" setup>
import { Editor } from '@tiptap/vue-3'
import type { JSONContent } from '@tiptap/core'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Link from '@/components/anzutap/marks/link/link'
import { onMounted, onUnmounted, ref, shallowRef, type Ref, watch, toRaw } from 'vue'
import AnzutapEditor from '@/components/anzutap/components/AnzutapEditor.vue'
import { cloneDeep } from '@anzusystems/common-admin'
import { checkForEmptyDocument } from '@/model/coreDam/factory/DocumentFactory'

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
