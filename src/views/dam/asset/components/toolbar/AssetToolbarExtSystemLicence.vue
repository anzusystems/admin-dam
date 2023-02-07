<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import AssetToolbarExtSystemLicenceDialog from '@/views/dam/asset/components/toolbar/AssetToolbarExtSystemLicenceDialog.vue'

const { t } = useI18n({ useScope: 'global' })

const { currentExtSystem } = useCurrentExtSystem()
const { currentAssetLicence } = useCurrentAssetLicence()

const dialog = ref(false)

const displayTextExtSystem = computed(() => {
  if (currentExtSystem.value) {
    return currentExtSystem.value.name
  }
  return ''
})

const displayTextLicence = computed(() => {
  if (currentAssetLicence.value) {
    return currentAssetLicence.value.name
  }
  return ''
})

const openDialog = () => {
  dialog.value = true
}
</script>

<template>
  <VBtn variant="text" size="small" class="mx-1" rounded="pill" :height="34" @click.stop="openDialog">
    {{ displayTextLicence }}
    <VIcon icon="mdi-chevron-down" />
    <VTooltip activator="parent" location="bottom">
      {{ t('system.mainBar.extSystemLicenceSwitch.extSystem') }}: {{ displayTextExtSystem }}<br />
      {{ t('system.mainBar.extSystemLicenceSwitch.licence') }}: {{ displayTextLicence }}
    </VTooltip>
  </VBtn>
  <AssetToolbarExtSystemLicenceDialog
    v-if="dialog"
    v-model="dialog"
    :ext-system-name="displayTextExtSystem"
    :licence-name="displayTextLicence"
  />
</template>
