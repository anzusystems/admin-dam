<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useCurrentAssetLicence } from '@/composables/system/currentLicence'
import { damConfig } from '@/services/DamConfigService'

const { t } = useI18n({ useScope: 'global' })

const { currentExtSystem } = useCurrentExtSystem()
const { currentAssetLicence } = useCurrentAssetLicence()

const dialog = ref(false)
const saving = ref(false)

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

const allowSelect = computed(() => {
  return true
  // return damConfig.settings.allowSelectExtSystem && damConfig.settings.allowSelectLicenceId
})

const openDialog = () => {
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const onConfirm = () => {
  saving.value = true
  dialog.value = false
}
</script>

<template>
  <VBtn variant="text" size="small" class="mx-1" @click.stop="openDialog">
    {{ displayTextLicence }}
    <VIcon icon="mdi-chevron-down" />
    <VTooltip activator="parent" location="bottom">
      Current ext system: {{ displayTextExtSystem }}<br />
      Current licence: {{ displayTextLicence }}
    </VTooltip>
  </VBtn>
  <VDialog v-model="dialog" persistent :width="500" no-click-animation>
    <VCard v-if="dialog" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">Switch DAM ext system and asset licence</div>
        </div>
        <VSpacer></VSpacer>
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click.stop="onCancel"
            data-cy="button-close"
          ></VBtn>
        </VToolbarItems>
      </VToolbar>
      <VCardText>
        <div>Important: Please finish all work first, any progress will be lost!</div>
      </VCardText>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn text @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="warning" @click.stop="onConfirm" data-cy="button-confirm" v-if="allowSelect"
          >Confirm and reload admin</VBtn
        >
      </VCardActions>
    </VCard>
  </VDialog>
</template>
