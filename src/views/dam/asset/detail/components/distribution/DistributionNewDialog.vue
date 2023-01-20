<script lang="ts" setup>
import { computed, ref } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import DistributionNewDialogYoutube from '@/views/dam/asset/detail/components/distribution/DistributionNewDialogYoutube.vue'
import DistributionNewDialogJw from '@/views/dam/asset/detail/components/distribution/DistributionNewDialogJw.vue'
import DistributionNewDialogCustom from '@/views/dam/asset/detail/components/distribution/DistributionNewDialogCustom.vue'
import DistributionNewDialogEmpty from '@/views/dam/asset/detail/components/distribution/DistributionNewDialogEmpty.vue'
import { type DistributionServiceName, DistributionServiceResourceName } from '@/types/dam/DamConfig'
import type { DocId } from '@/types/common'
import { isNull } from '@/utils/common'
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
const value = computed({
  get() {
    return props.modelValue
  },
  set(newValue: boolean) {
    emit('update:modelValue', newValue)
  },
})

const { t } = useI18n({ useScope: 'global' })

const activeDistributionName = ref<DistributionServiceName | null>(null)

const closeDialog = (reloadList = false) => {
  value.value = false
  if (reloadList) emit('reloadList')
}

const serviceRequirements = computed(() => {
  return damConfigExtSystem[props.assetType].distribution.distributionRequirements
})

const activeConfig = computed(() => {
  if (isNull(activeDistributionName.value)) return null
  return serviceRequirements.value[activeDistributionName.value]
})

const activeDistributionResource = computed(() => {
  if (isNull(activeConfig.value)) return null
  return activeConfig.value.distributionService.resourceName
})

const componentComputed = computed(() => {
  switch (activeDistributionResource.value) {
    case DistributionServiceResourceName.Youtube:
      return DistributionNewDialogYoutube
    case DistributionServiceResourceName.Jw:
      return DistributionNewDialogJw
    case DistributionServiceResourceName.Custom:
      return DistributionNewDialogCustom
    default:
      return DistributionNewDialogEmpty
  }
})
</script>

<template>
  <VDialog v-model="value" persistent no-click-animation scrollable :max-width="1400">
    <VCard v-if="value">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t('coreDam.distribution.common.addTitle') }}</div>
        </div>
        <VSpacer></VSpacer>
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click.stop="closeDialog(false)"
            data-cy="button-close"
          ></VBtn>
        </VToolbarItems>
      </VToolbar>
      <div>
        <VTabs density="compact" v-model="activeDistributionName" class="sidebar-info__tabs">
          <VTab v-for="(value, key) in serviceRequirements" :key="key" :value="key">{{ value.title }}</VTab>
        </VTabs>
      </div>
      <component
        v-if="activeDistributionName"
        :is="componentComputed"
        :asset-id="assetId"
        :asset-type="assetType"
        :config="activeConfig"
        :distribution-service-name="activeDistributionName"
        @close-dialog="closeDialog"
        :key="activeDistributionName"
      ></component>
    </VCard>
  </VDialog>
</template>
