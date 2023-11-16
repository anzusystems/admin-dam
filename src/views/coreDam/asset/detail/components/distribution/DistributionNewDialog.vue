<script lang="ts" setup>
import { computed } from 'vue'
import type { DamAssetType } from '@anzusystems/common-admin'
import DistributionNewDialogYoutube from '@/views/coreDam/asset/detail/components/distribution/DistributionNewDialogYoutube.vue'
import DistributionNewDialogJw from '@/views/coreDam/asset/detail/components/distribution/DistributionNewDialogJw.vue'
import DistributionNewDialogCustom from '@/views/coreDam/asset/detail/components/distribution/DistributionNewDialogCustom.vue'
import DistributionNewDialogEmpty from '@/views/coreDam/asset/detail/components/distribution/DistributionNewDialogEmpty.vue'
import { DamDistributionServiceType } from '@anzusystems/common-admin'
import { type DocId, useDamConfigState } from '@anzusystems/common-admin'
import { ADialogToolbar, isNull } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { useAssetDetailDistributionDialog } from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialog'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    assetType: DamAssetType
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

const closeDialog = () => {
  value.value = false
  emit('reloadList')
}

const { damConfigExtSystem } = useDamConfigState()

const serviceRequirements = computed(() => {
  return damConfigExtSystem.value[props.assetType].distribution.distributionRequirements
})

const activeConfig = computed(() => {
  if (isNull(activeDistributionName.value)) return null
  return serviceRequirements.value[activeDistributionName.value]
})

const { damPrvConfig } = useDamConfigState()

const activeDistributionType = computed(() => {
  if (isNull(activeDistributionName.value)) return null
  if (damPrvConfig.value.distributionServices[activeDistributionName.value]) {
    return damPrvConfig.value.distributionServices[activeDistributionName.value].type
  }
  return null
})

const componentComputed = computed(() => {
  switch (activeDistributionType.value) {
    case DamDistributionServiceType.Youtube:
      return DistributionNewDialogYoutube
    case DamDistributionServiceType.Jw:
      return DistributionNewDialogJw
    case DamDistributionServiceType.Custom:
      return DistributionNewDialogCustom
    default:
      return DistributionNewDialogEmpty
  }
})
</script>

<template>
  <VDialog
    v-model="value"
    scrollable
    :max-width="1400"
    class="dialog-distribution"
  >
    <VCard v-if="value">
      <ADialogToolbar @on-cancel="closeDialog">
        <span v-if="redistributeMode">{{ t('coreDam.distribution.common.redistributeTitle') }}</span>
        <span v-else>{{ t('coreDam.distribution.common.addTitle') }}</span>
      </ADialogToolbar>
      <div v-if="showTabs">
        <VTabs
          v-model="activeDistributionName"
          density="compact"
          class="sidebar-info__tabs"
        >
          <VTab
            v-for="(requirement, key) in serviceRequirements"
            :key="key"
            :value="key"
          >
            {{ requirement.title }}
          </VTab>
        </VTabs>
      </div>
      <component
        :is="componentComputed"
        v-if="activeDistributionName && activeConfig"
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
