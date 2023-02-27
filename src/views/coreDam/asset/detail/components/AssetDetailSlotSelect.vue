<script lang="ts" setup>
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { computed, onMounted, ref, watch } from 'vue'
import { useAssetDetailSidebarSlotsActions } from '@/views/coreDam/asset/detail/composables/assetDetailSidebarSlotsActions'
import { useAssetSlotsStore } from '@/stores/coreDam/assetSlotsStore'
import type { DocId } from '@anzusystems/common-admin'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'

const emit = defineEmits<{
  (e: 'activeSlotChange', data: null | AssetSlot): void
}>()

const activeSlot = ref<DocId>('')
const loading = ref(false)

const assetDetailStore = useAssetDetailStore()
const assetSlotsStore = useAssetSlotsStore()

const { getList } = useAssetDetailSidebarSlotsActions(
  assetDetailStore.asset!.id,
  assetDetailStore.asset!.attributes.assetType
)

const initLoad = async () => {
  loading.value = true
  await getList()
  if (assetSlotsStore.list.length > 0) {
    const found = assetSlotsStore.list.find((item) => {
      return item.main === true
    })
    if (found) {
      activeSlot.value = found.slotName
      loading.value = false
      return
    }
    activeSlot.value = assetSlotsStore.list[0].slotName
    loading.value = false
    return
  }
  loading.value = false
}

const slotItems = computed(() => {
  return assetSlotsStore.list.map((item) => {
    return item.slotName
  })
})

const isDisabled = computed(() => {
  return loading.value || assetSlotsStore.list.length <= 1
})

watch(activeSlot, (newValue, oldValue) => {
  if (newValue !== oldValue && oldValue !== '') {
    const found = assetSlotsStore.list.find((item) => {
      return item.slotName === newValue
    })
    emit('activeSlotChange', found ? found : null)
  }
})

onMounted(async () => {
  await initLoad()
})
</script>

<template>
  <VSelect
    v-model="activeSlot"
    :loading="loading"
    :disabled="isDisabled"
    label="Asset slot"
    :items="slotItems"
    hide-details
  />
</template>
