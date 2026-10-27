<script lang="ts" setup>
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import { isUndefined } from '@anzusystems/common-admin'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAssetDetailSidebarSlotsActions } from '@/domains/coreDam/asset/components/detail/composables/assetDetailSidebarSlotsActions'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetSlotsStore } from '@/domains/coreDam/asset/store/assetSlotsStore'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'

const props = defineProps<{
  /* The file the form around works with: the slot that holds it is picked first, and a slot picked in its place is
   * told to the form. Left out, the main slot is picked and nothing is told until the user picks another. */
  assetFileId?: DocIdNullable
}>()

const emit = defineEmits<{ activeSlotChange: [data: null | AssetSlot] }>()

const { t } = useI18n()

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
    const held = isUndefined(props.assetFileId)
      ? undefined
      : assetSlotsStore.list.find((item) => item.assetFile?.id === props.assetFileId)
    const found = held ?? assetSlotsStore.list.find((item) => item.main === true) ?? assetSlotsStore.list[0]
    activeSlot.value = found.slotName
    if (!held && !isUndefined(props.assetFileId)) emit('activeSlotChange', found)
    loading.value = false
    return
  }
  loading.value = false
}

const slotItems = computed(() => assetSlotsStore.list.map((item) => item.slotName))

const isDisabled = computed(() => loading.value || assetSlotsStore.list.length <= 1)

watch(activeSlot, (newValue, oldValue) => {
  if (newValue !== oldValue && oldValue !== '') {
    const found = assetSlotsStore.list.find((item) => item.slotName === newValue)
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
    :label="t('coreDam.asset.slots.assetSlot')"
    :items="slotItems"
    hide-details
  />
</template>
