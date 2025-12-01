<script lang="ts" setup>
import { Editor, useEditor } from '@tiptap/vue-3'
import type { JSONContent } from '@tiptap/core'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import { onMounted, onUnmounted, ref, shallowRef, type Ref, watch, toRaw } from 'vue'
import AnzutapEditor from '@/components/anzutap/components/AnzutapEditor.vue'
import { cloneDeep } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    editable?: boolean
  }>(),
  {
    editable: false,
  }
)

const content = defineModel<JSONContent>('modelValue', { required: true })

const initialized = ref(false)
const anzutapEditorComponent = ref<InstanceType<typeof AnzutapEditor> | null>(null)
const editor: Ref<Editor | undefined> = shallowRef(undefined)

const contentCloned = cloneDeep(toRaw(content.value))

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
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }).extend({
        addStorage() {
          return {
            dialog: ref(false),
          }
        },
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
    :editable="editable"
  />
</template>
