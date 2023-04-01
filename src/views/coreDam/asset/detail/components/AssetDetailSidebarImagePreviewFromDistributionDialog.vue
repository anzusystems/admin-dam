<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { ACard, ADatatablePagination, type DocId, isNull, useAlerts, usePagination } from '@anzusystems/common-admin'
import { useVideoDistributionPreviewListActions } from '@/views/coreDam/asset/detail/composables/videoDistributionPreviewActions'
import DistributionImagePreviewItem from '@/views/coreDam/asset/detail/components/DistributionImagePreviewItem.vue'
import { setVideoFileDistributionPreview } from '@/services/api/coreDam/videoApi'
import { useI18n } from 'vue-i18n'
import { damConfig } from '@/services/DamConfigService'

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

const selectedTitle = computed(() => {
  if (lastSelectedItem.value && damConfig.distributionServices[lastSelectedItem.value.service]) {
    return damConfig.distributionServices[lastSelectedItem.value.service].title
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
    persistent
    no-click-animation
    scrollable
    :max-width="800"
  >
    <VCard>
      <VToolbar
        class="pl-2"
        density="compact"
      >
        <div class="d-block pl-0 w-100">
          <div class="text-h6">
            {{ t('system.imagePreview.actions.chooseFromDistribution') }}
          </div>
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
        <VBtn
          color="success"
          :loading="saving"
          :disabled="!lastSelectedItem"
          @click.stop="onConfirm"
        >
          {{ t('common.button.confirm') }}
        </VBtn>
        <VBtn
          text
          @click.stop="closeDialog"
        >
          {{ t('common.button.cancel') }}
        </VBtn>
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
