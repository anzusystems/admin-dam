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

<style lang="scss">
.anzutap {
  &__card {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    background-color: rgb(var(--v-theme-surface));
  }

  &__content {
    padding: 12px;
    min-height: 200px;

    .ProseMirror {
      outline: none;
      min-height: 180px;

      p {
        margin: 0 0 1em 0;

        &:last-child {
          margin-bottom: 0;
        }
      }

      strong {
        font-weight: bold;
      }

      em {
        font-style: italic;
      }

      u {
        text-decoration: underline;
      }

      a {
        color: rgb(var(--v-theme-primary));
        text-decoration: underline;
        cursor: pointer;

        &:hover {
          color: rgb(var(--v-theme-primary-darken-1));
        }
      }
    }

    .ProseMirror-focused {
      outline: none;
    }
  }

  &--readonly {
    .anzutap__content {
      background-color: rgba(var(--v-theme-surface-variant), 0.3);
    }
  }

  &--focused {
    .anzutap__card {
      border-color: rgb(var(--v-theme-primary));
    }
  }
}
</style>
