<script lang="ts" setup>
import { useDamConfigState } from '@anzusystems/common-admin'
import { AFilterValueObjectOptionsSelect } from '@anzusystems/common-admin/labs'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { damClient } from '@/shared/apiClients/damClient'

defineProps<{
  name: string
}>()

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const items = computed(() => {
  return [
    ...(configExtSystem.audio?.slots ?? []),
    ...(configExtSystem.image?.slots ?? []),
    ...(configExtSystem.video?.slots ?? []),
    ...(configExtSystem.document?.slots ?? []),
  ]
    .filter((value, index, array) => array.indexOf(value) === index)
    .map((item) => ({ title: item, value: item }))
})
</script>

<template>
  <AFilterValueObjectOptionsSelect
    :name="name"
    :items="items"
  />
</template>
