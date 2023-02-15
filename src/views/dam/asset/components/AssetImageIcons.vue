<script lang="ts" setup>
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { AssetFileProperties } from '@/types/dam/Asset'
import { computed } from 'vue'

const ICON_COLOR = '#505050'

const props = withDefaults(
  defineProps<{
    assetType: AssetType
    assetFileProperties: AssetFileProperties
  }>(),
  {}
)

const data = computed(() => {
  return {
    slots: {
      show: props.assetFileProperties.slotNames.length > 1,
    },
    distribution: {
      show: props.assetFileProperties.distributesInServices.length > 0,
    },
  }
})
</script>

<template>
  <div v-show="data.slots.show || data.distribution.show" class="asset-image__meta-icons">
    <VIcon v-show="data.slots.show" icon="mdi-label-multiple-outline" :color="ICON_COLOR" />
    <VIcon v-show="data.distribution.show" icon="mdi-airplane" :color="ICON_COLOR" />
  </div>
</template>

<style lang="scss">
// todo move to scss file
.asset-image__meta-icons {
  position: absolute;
  left: 6px;
  top: 163px;
  padding: 2px;
  background-color: rgba(204, 204, 204, 0.5);
  border-radius: 4px;
}
</style>
