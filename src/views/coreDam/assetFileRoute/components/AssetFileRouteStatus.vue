<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { type AssetFileMainRouteAware } from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    assetFileRoute: AssetFileMainRouteAware
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
)
const emit = defineEmits<{
  (e: 'openMakePublicDialog'): void
  (e: 'makePrivate'): void
}>()

const makePublic = () => {
  emit('openMakePublicDialog')
}
const makePrivate = () => {
  emit('makePrivate')
}

const { t } = useI18n()
</script>

<template>
  <!-- todo check status-->
  <VChip
    v-if="assetFileRoute.mainRoute"
    color="success"
    label
    size="small"
    class="mr-2"
  >
    {{ t('coreDam.asset.assetFilePublicLink.status.public') }}
  </VChip>
  <VChip
    v-else
    color="primary"
    label
    size="small"
    class="mr-2"
  >
    {{ t('coreDam.asset.assetFilePublicLink.status.private') }}
  </VChip>
</template>
