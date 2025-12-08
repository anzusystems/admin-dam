<script lang="ts" setup>
import LinkDialog from '@/components/anzutap/marks/link/components/LinkDialog.vue'
import type { Editor } from '@tiptap/core'

withDefaults(
  defineProps<{
    editor: Editor | undefined
  }>(),
  {}
)
</script>

<template>
  <LinkDialog :editor="editor" />
</template>
