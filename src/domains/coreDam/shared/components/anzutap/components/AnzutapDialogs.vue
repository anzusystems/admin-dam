<script lang="ts" setup>
import type { Editor } from '@tiptap/core'

import LinkDialog from '@/domains/coreDam/shared/components/anzutap/marks/link/components/LinkDialog.vue'

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
