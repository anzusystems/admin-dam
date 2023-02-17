<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { type DocId, isNull, usePagination } from '@anzusystems/common-admin'
import { useVideoDistributionPreviewListActions } from '@/views/dam/asset/detail/composables/videoDistributionPreviewActions'
import DistributionImagePreviewItem from '@/views/dam/asset/detail/components/DistributionImagePreviewItem.vue'
import { ACard } from '@anzusystems/common-admin'
import { setVideoFileDistributionPreview } from '@/services/api/dam/videoApi'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
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

const { t } = useI18n({ useScope: 'global' })

const saving = ref(false)

const pagination = usePagination()
pagination.rowsPerPage = 12
const filter = {}
const { listItems, fetchList, listLoading, toggleSelectedItem, lastSelectedItem } =
  useVideoDistributionPreviewListActions()
const getList = () => {
  fetchList(props.fileId, pagination, filter)
}

const toggleSelected = (index: number) => {
  toggleSelectedItem(index)
}

const closeDialog = () => {
  emit('update:modelValue', false)
}

const { showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const onConfirm = async () => {
  if (isNull(lastSelectedItem.value)) return
  saving.value = true
  try {
    await setVideoFileDistributionPreview(props.fileId, lastSelectedItem.value.id)
    closeDialog()
    showRecordWas('updated')
    emit('afterSuccessfulConfirm')
  } catch (e) {
    handleError(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  getList()
})
</script>

<template>
  <VDialog :model-value="modelValue" persistent no-click-animation scrollable :max-width="800">
    <VCard>
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">Choose as preview image</div>
        </div>
        <VSpacer />
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            data-cy="button-close"
            @click.stop="closeDialog"
          />
        </VToolbarItems>
      </VToolbar>
      <VCardText>
        <ACard :loading="listLoading" inner-div-class="">
          <div v-if="listItems.length === 0" class="text-center text-caption w-100 pa-2">
            {{ t('coreDam.distribution.common.noEntries') }}
          </div>
          <div v-else class="dam-image-grid dam-image-grid--special">
            <DistributionImagePreviewItem
              v-for="(item, index) in listItems"
              :key="item.id"
              :index="index"
              :item="item"
              @toggle-selected="toggleSelected"
            />
          </div>
          <ADatatablePagination v-model="pagination" hide-records-per-page @change="getList" />
        </ACard>
      </VCardText>
      <VCardActions>
        <div v-if="lastSelectedItem" class="text-caption pl-2">Selected: {{ lastSelectedItem.id }}</div>
        <VSpacer />
        <VBtn color="success" :loading="saving" :disabled="!lastSelectedItem" @click.stop="onConfirm">Confirm</VBtn>
        <VBtn text @click.stop="closeDialog">Cancel</VBtn>
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
