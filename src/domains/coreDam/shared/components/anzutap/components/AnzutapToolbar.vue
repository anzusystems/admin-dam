<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { computed } from 'vue'

import { useAnzutapToolbar } from '@/domains/coreDam/shared/components/anzutap/components/anzutapToolbar'
import AnzutapToolbarItem from '@/domains/coreDam/shared/components/anzutap/components/AnzutapToolbarItem.vue'

const props = withDefaults(
  defineProps<{
    editor: Editor | undefined
    editable?: boolean
  }>(),
  {
    editable: false,
  }
)

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { itemsRow1 } = useAnzutapToolbar(props.editor)

// Recomputed on every editor state change: some items show only at the cursor position, such as link removal.
const items = computed(() => ({
  row1Visible: itemsRow1.filter((item) => item.type === 'separator' || item.show()),
}))
</script>

<template>
  <VToolbar
    v-if="editable && editor"
    :elevation="0"
    class="anzutap-toolbar"
    density="compact"
    height="auto"
  >
    <div class="anzutap-toolbar__container">
      <AnzutapToolbarItem
        v-for="item in items.row1Visible"
        :key="item.id"
        :item="item"
      />
    </div>
  </VToolbar>
</template>
