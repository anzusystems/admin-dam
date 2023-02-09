<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { DocId, usePagination } from '@anzusystems/common-admin'
import { useVideoDistributionPreviewListActions } from '@/views/dam/asset/detail/composables/videoDistributionPreviewActions'
import DistributionImagePreviewItem from '@/views/dam/asset/detail/components/DistributionImagePreviewItem.vue'
import ACard from '@/components/common/ACard.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    fileId: DocId
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: boolean): void
}>()

const saving = ref(false)

const pagination = usePagination()
const filter = {}
const { listItems, fetchList, listLoading } = useVideoDistributionPreviewListActions()
const getList = () => {
  fetchList(props.fileId, pagination, filter)
}

const closeDialog = () => {
  emit('update:modelValue', false)
}

const onConfirm = () => {
  closeDialog()
}

onMounted(async () => {
  getList()
})
</script>

<template>
  <VDialog :model-value="modelValue" persistent no-click-animation :width="500">
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
          <DistributionImagePreviewItem v-for="item in listItems" :key="item.id" :item="item" />
          <ADatatablePagination v-model="pagination" hide-records-per-page @change="getList" />
        </ACard>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn color="success" :loading="saving" @click.stop="onConfirm">Confirm</VBtn>
        <VBtn text @click.stop="closeDialog">Cancel</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
