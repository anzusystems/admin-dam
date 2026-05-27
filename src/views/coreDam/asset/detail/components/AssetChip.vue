<script lang="ts" setup>
import type { DocId } from '@anzusystems/common-admin'
import { COMMON_CONFIG, isString } from '@anzusystems/common-admin'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    id: null | DocId | undefined
  }>(),
  {}
)

const router = useRouter()

const onAssetChipClick = () => {
  if (isString(props.id)) {
    router.push({ name: '/(coreDam)/asset/[id]', params: { id: props.id } })
  }
}
</script>

<template>
  <VChip
    v-if="id"
    size="small"
    :append-icon="COMMON_CONFIG.CHIP.ICON.LINK"
    label
    @click.stop="onAssetChipClick"
  >
    {{ id }}
  </VChip>
</template>
