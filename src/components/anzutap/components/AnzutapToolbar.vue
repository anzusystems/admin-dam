<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { useAnzutapToolbar, type ToolbarItemButton, type ToolbarItemSeparator } from './anzutapToolbar'
import AnzutapToolbarItem from './AnzutapToolbarItem.vue'
import { computed, onMounted, ref } from 'vue'

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

const enabledItems = ref<Array<ToolbarItemButton | ToolbarItemSeparator>>([])

const items = computed(() => {
  return {
    row1Visible: enabledItems.value,
  }
})

onMounted(async () => {
  const items: Array<ToolbarItemButton | ToolbarItemSeparator> = []
  itemsRow1.forEach((item) => {
    if (item.type === 'separator') {
      items.push(item)
    } else if (item.show()) {
      items.push(item)
    }
  })
  enabledItems.value = items
})
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

<style lang="scss" scoped>
.anzutap-toolbar {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  &__container {
    display: flex;
    gap: 2px;
    padding: 4px 8px;
    align-items: center;
    width: 100%;
  }
}
</style>
