<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

</script>

<template>
  <VChip
    label
    size="small"
    color="warning"
  >
    {{ t('coreDam.asset.queueItem.duplicate') }}
  </VChip>
</template>
