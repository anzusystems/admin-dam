<script lang="ts" setup>
import { useDamConfigStore, AFilterValueObjectOptionsSelect } from '@anzusystems/common-admin'

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
