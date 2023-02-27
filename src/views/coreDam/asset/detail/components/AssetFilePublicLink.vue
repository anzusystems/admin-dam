<script setup lang="ts">
withDefaults(
  defineProps<{
    previewLink: string | null
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'openMakePublicDialog'): void
  (e: 'makePrivate'): void
}>()

const makePublic = () => {
  emit('openMakePublicDialog')
}
const makePrivate = () => {
  emit('makePrivate')
}
</script>

<template>
  <div v-if="previewLink">
    <div class="d-flex align-center">
      <VChip color="success" label size="small" class="mr-2">File is public</VChip>
      <VBtn variant="text" size="small" :href="previewLink" target="_blank" class="text-left mr-2">
        Open <VIcon size="small" icon="mdi-open-in-new" />
      </VBtn>
      <VBtn size="small" variant="text" @click.stop="makePrivate">Make private</VBtn>
    </div>
  </div>
  <div v-else>
    <div class="d-flex align-center">
      <VChip color="primary" label size="small" class="mr-2">File is private</VChip>
      <VBtn size="small" variant="text" @click.stop="makePublic">Make public</VBtn>
    </div>
  </div>
</template>
