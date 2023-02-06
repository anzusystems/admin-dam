<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { Grant, useGrant } from '@anzusystems/common-admin'

const props = defineProps<{
  availableGrants: Grant[]
  selectedGrant: Grant | undefined
}>()
const emit = defineEmits<{
  (e: 'change', data?: Grant): void
}>()
const selectedGrant = computed({
  get() {
    return props.selectedGrant
  },
  set(newGrant) {
    emit('change', newGrant)
  },
})
const { getGrantOption } = useGrant()

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VBtnToggle v-model="selectedGrant" divided density="compact" variant="outlined" class="text-disabled">
    <VBtn
      v-for="availableGrant in availableGrants"
      :key="availableGrant"
      :value="availableGrant"
      :color="getGrantOption(availableGrant).color"
    >
      {{ getGrantOption(availableGrant).title }}
    </VBtn>
  </VBtnToggle>
</template>
