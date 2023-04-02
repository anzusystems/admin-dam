<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { DocId } from '@anzusystems/common-admin'
import { ADialogToolbar } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    assetType: AssetType
    assetId: DocId
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: boolean): void
  (e: 'reloadList'): void
}>()
const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: boolean) {
    emit('update:modelValue', newValue)
  },
})

const { t } = useI18n()

const buttonLoading = ref(false)

const onCancel = () => {
  modelValueComputed.value = false
}

const onConfirm = () => {
  // todo
}
</script>

<template>
  <VDialog
    v-model="modelValueComputed"
    scrollable
    :max-width="500"
  >
    <VCard v-if="modelValueComputed">
      <ADialogToolbar @on-cancel="onCancel">
        todo stop/cancel distribution
      </ADialogToolbar>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="buttonLoading"
          @click.stop="onConfirm"
        >
          {{ t('common.button.confirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
</style>
