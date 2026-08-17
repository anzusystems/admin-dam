<script lang="ts" setup>
import { AChipNoLink } from '@anzusystems/common-admin'

const { t } = useI18n()
</script>

<template>
  <AChipNoLink color="warning">
    {{ t('coreDam.asset.queueItem.duplicate') }}
  </AChipNoLink>
</template>
