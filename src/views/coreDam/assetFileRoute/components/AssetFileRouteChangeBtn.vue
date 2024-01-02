<script setup lang="ts">
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    buttonT?: string
    icon?: string
    dataCy?: string
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    buttonT: 'coreDam.asset.assetFilePublicLink.actions.makePublic',
    icon: 'mdi-lock-open',
    dataCy: 'button-save',
    loading: undefined,
    disabled: undefined,
  }
)

const { t } = useI18n()
</script>

<template>
  <VBtn
    size="x-small"
    icon
    variant="text"
    :loading="loading"
    :disabled="disabled"
    :data-cy="dataCy"
  >
    <VIcon :icon="icon" />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t(buttonT) }}
    </VTooltip>
  </VBtn>
</template>
