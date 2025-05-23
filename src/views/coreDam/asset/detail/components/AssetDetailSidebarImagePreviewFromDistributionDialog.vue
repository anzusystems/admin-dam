<script lang="ts" setup>
import { setVideoFileDistributionPreview } from '@/services/api/coreDam/videoApi'
import DistributionImagePreviewItem from '@/views/coreDam/asset/detail/components/DistributionImagePreviewItem.vue'
import { useVideoDistributionPreviewListActions } from '@/views/coreDam/asset/detail/composables/videoDistributionPreviewActions'
import {
  ACard,
  ADatatablePagination,
  ADialogToolbar,
  type DocId,
  isNull,
  useAlerts,
  useDamConfigStore,
  usePagination,
} from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    fileId: DocId
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: boolean): void
  (e: 'afterSuccessfulConfirm'): void
}>()

const { t } = useI18n()

const saving = ref(false)

const pagination = usePagination()
pagination.rowsPerPage = 12
const filter = {}
const { listItems, fetchList, listLoading, toggleSelectedItem, itemImageIsInvalid, lastSelectedItem } =
  useVideoDistributionPreviewListActions()
const getList = () => {
  fetchList(props.fileId, pagination, filter)
}

const toggleSelected = (index: number) => {
  toggleSelectedItem(index)
}

const invalidImage = (index: number) => {
  itemImageIsInvalid(index)
}

const closeDialog = () => {
  emit('update:modelValue', false)
}

const { showRecordWas, showErrorsDefault } = useAlerts()

const onConfirm = async () => {
  if (isNull(lastSelectedItem.value)) return
  saving.value = true
  try {
    await setVideoFileDistributionPreview(props.fileId, lastSelectedItem.value.id)
    closeDialog()
    showRecordWas('updated')
    emit('afterSuccessfulConfirm')
  } catch (e) {
    showErrorsDefault(e)
  } finally {
    saving.value = false
  }
}

const damConfigStore = useDamConfigStore()
const { damPrvConfig } = storeToRefs(damConfigStore)

const selectedTitle = computed(() => {
  if (lastSelectedItem.value && damPrvConfig.value.distributionServices[lastSelectedItem.value.service]) {
    return damPrvConfig.value.distributionServices[lastSelectedItem.value.service].title
  }
  return ''
})

onMounted(async () => {
  getList()
})
</script>

<template>
  <VDialog
    :model-value="modelValue"
    scrollable
    :max-width="800"
  >
    <VCard>
      <ADialogToolbar @on-cancel="closeDialog">
        {{ t('system.imagePreview.actions.chooseFromDistribution') }}
      </ADialogToolbar>
      <VCardText>
        <ACard
          :loading="listLoading"
          inner-div-class=""
        >
          <div
            v-if="listItems.length === 0"
            class="text-center text-caption w-100 pa-2"
          >
            {{ t('coreDam.distribution.common.noEntries') }}
          </div>
          <div
            v-else
            class="dam-image-grid dam-image-grid--special"
          >
            <DistributionImagePreviewItem
              v-for="(item, index) in listItems"
              :key="item.id"
              :index="index"
              :item="item"
              @toggle-selected="toggleSelected"
              @invalid-image="invalidImage"
            />
          </div>
          <ADatatablePagination
            v-model="pagination"
            hide-records-per-page
            @change="getList"
          />
        </ACard>
      </VCardText>
      <VCardActions>
        <div
          v-if="lastSelectedItem"
          class="text-caption pl-2"
        >
          {{ t('system.imagePreview.selected') }}: {{ selectedTitle }}
        </div>
        <VSpacer />
        <ABtnTertiary @click.stop="closeDialog">
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="saving"
          :disabled="!lastSelectedItem"
          @click.stop="onConfirm"
        >
          {{ t('common.button.confirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss" scoped>
.dam-image-grid--special {
  display: grid;
  grid-template-columns: repeat(3, auto);
}
</style>
