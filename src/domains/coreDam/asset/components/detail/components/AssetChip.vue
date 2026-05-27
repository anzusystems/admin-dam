<script lang="ts" setup>
import { COMMON_CONFIG } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    id: null | DocId | undefined
  }>(),
  {}
)

const router = useRouter()

const onAssetChipClick = () => {
  if (isString(props.id)) {
    router.push({ name: '/(coreDam)/assets/[id]', params: { id: props.id } })
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
