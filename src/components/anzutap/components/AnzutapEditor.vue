<script lang="ts" setup>
import AnzutapToolbar from '@/components/anzutap/components/AnzutapToolbar.vue'
import AnzutapDialogs from '@/components/anzutap/components/AnzutapDialogs.vue'
import { type Editor, EditorContent } from '@tiptap/vue-3'
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    editor: Editor | undefined
    label?: string | undefined
    editable?: boolean
  }>(),
  {
    label: undefined,
    editable: false,
  }
)

const focused = ref(false)

const onFocus = () => {
  focused.value = true
}

const onBlur = () => {
  focused.value = false
}

const anzutapClass = computed(() => {
  const classes: string[] = []
  if (!props.editable) classes.push('anzutap--readonly')
  if (focused.value) classes.push('anzutap--focused')

  return classes.join(' ')
})

const focusIfNot = () => {
  if (props.editor && !props.editor.isFocused) {
    props.editor.chain().focus().run()
  }
}

defineExpose({
  onBlur,
  onFocus,
})
</script>

<template>
  <VCol
    cols="12"
    class="pa-0"
  >
    <h4
      v-if="label"
      class="w-100 font-weight-bold text-subtitle-2 d-flex gc-2 align-center justify-space-between"
    >
      <div>
        <slot name="label-start" />
        {{ label }}
      </div>
      <div>
        <slot name="label-end" />
      </div>
    </h4>
  </VCol>
  <div class="w-100 position-relative">
    <div
      class="anzutap w-100"
      :class="anzutapClass"
    >
      <div class="anzutap__card">
        <AnzutapToolbar
          :editor="editor"
          :editable="editable"
        />
        <AnzutapDialogs
          v-if="editable"
          :editor="editor"
        />
        <EditorContent
          v-if="editor"
          :editor="editor"
          class="anzutap__content"
          @click.prevent="focusIfNot"
        />
      </div>
    </div>
  </div>
</template>
