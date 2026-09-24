<script lang="ts" setup>
import { AFilterValueObjectOptionsSelect, useDamConfigStore } from '@anzusystems/common-admin'
import { computed } from 'vue'

defineProps<{
  name: string
}>()

const damConfigStore = useDamConfigStore()

const items = computed(() => {
  return Object.entries(damConfigStore.damPrvConfig.distributionServices).map(([key, value]) => {
    return {
      title: value.title,
      value: key,
    }
  })
})
</script>

<template>
  <AFilterValueObjectOptionsSelect
    :name="name"
    :items="items"
  />
</template>
