<script lang="ts" setup>
import { COMMON_CONFIG } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'

const props = withDefaults(
  defineProps<{
    id: null | DocId | undefined
  }>(),
  {}
)

const router = useRouter()

const assetDetailStore = useAssetDetailStore()

const onAssetChipClick = () => {
  assetDetailStore.reset()
  router.push({ name: ROUTE.DAM.ASSET.DETAIL, params: { id: props.id } })
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
