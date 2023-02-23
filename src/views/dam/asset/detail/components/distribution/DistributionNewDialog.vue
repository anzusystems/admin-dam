<script lang="ts" setup>
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import DistributionNewDialogYoutube from '@/views/dam/asset/detail/components/distribution/DistributionNewDialogYoutube.vue'
import DistributionNewDialogJw from '@/views/dam/asset/detail/components/distribution/DistributionNewDialogJw.vue'
import DistributionNewDialogCustom from '@/views/dam/asset/detail/components/distribution/DistributionNewDialogCustom.vue'
import DistributionNewDialogEmpty from '@/views/dam/asset/detail/components/distribution/DistributionNewDialogEmpty.vue'
import { DistributionServiceType } from '@/types/dam/DamConfig'
import type { DocId } from '@anzusystems/common-admin'
import { isNull } from '@/utils/common'
import { useI18n } from 'vue-i18n'
import { damConfig } from '@/services/DamConfigService'
import { useAssetDetailDistributionDialog } from '@/views/dam/asset/detail/composables/assetDetailDistributionDialog'

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

const { t } = useI18n()

const { activeDistributionName, showTabs, redistributeMode } = useAssetDetailDistributionDialog()

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

const activeDistributionType = computed(() => {
  if (isNull(activeDistributionName.value)) return null
  if (damConfig.distributionServices[activeDistributionName.value]) {
    return damConfig.distributionServices[activeDistributionName.value].type
  }
  return null
})

const componentComputed = computed(() => {
  switch (activeDistributionType.value) {
    case DistributionServiceType.Youtube:
      return DistributionNewDialogYoutube
    case DistributionServiceType.Jw:
      return DistributionNewDialogJw
    case DistributionServiceType.Custom:
      return DistributionNewDialogCustom
    default:
      return DistributionNewDialogEmpty
  }
})
</script>

<template>
  <VDialog v-model="value" persistent no-click-animation scrollable :max-width="1400" class="dialog-distribution">
    <VCard v-if="value">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div v-if="redistributeMode" class="text-h6">{{ t('coreDam.distribution.common.redistributeTitle') }}</div>
          <div v-else class="text-h6">{{ t('coreDam.distribution.common.addTitle') }}</div>
        </div>
        <VSpacer />
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            data-cy="button-close"
            @click.stop="closeDialog(false)"
          />
        </VToolbarItems>
      </VToolbar>
      <div v-if="showTabs">
        <VTabs v-model="activeDistributionName" density="compact" class="sidebar-info__tabs">
          <VTab v-for="(requirement, key) in serviceRequirements" :key="key" :value="key">{{ requirement.title }}</VTab>
        </VTabs>
      </div>
      <component
        :is="componentComputed"
        v-if="activeDistributionName"
        :key="activeDistributionName"
        :asset-id="assetId"
        :asset-type="assetType"
        :config="activeConfig"
        :distribution-service-name="activeDistributionName"
        @close-dialog="closeDialog"
      />
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.v-dialog.dialog-distribution {
  align-items: start;

  .v-overlay__content {
    margin-top: 50px;
  }
}
</style>
