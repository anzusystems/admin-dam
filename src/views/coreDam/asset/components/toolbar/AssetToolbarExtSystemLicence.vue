<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AssetToolbarExtSystemLicenceDialog from '@/views/coreDam/asset/components/toolbar/AssetToolbarExtSystemLicenceDialog.vue'

withDefaults(
  defineProps<{
    extSystemName: string
    licenceName: string
  }>(),
  {}
)

const { t } = useI18n()

const dialog = ref(false)

const openDialog = () => {
  dialog.value = true
}
</script>

<template>
  <VBtn
    variant="text"
    size="small"
    class="mx-1"
    rounded="pill"
    data-cy="button-manage-licence"
    :height="34"
    @click.stop="openDialog"
  >
    <VIcon icon="mdi-chevron-down" />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('system.mainBar.extSystemLicenceSwitch.extSystem') }}: {{ extSystemName }}<br>
      {{ t('system.mainBar.extSystemLicenceSwitch.licence') }}: {{ licenceName }}
    </VTooltip>
  </VBtn>
  <AssetToolbarExtSystemLicenceDialog
    v-if="dialog"
    v-model="dialog"
    :ext-system-name="extSystemName"
    :licence-name="licenceName"
  />
</template>
