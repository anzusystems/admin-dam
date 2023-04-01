<script setup lang="ts">
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    previewLink: string | null
  }>(),
  {}
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
  <div v-if="previewLink">
    <div class="d-flex align-center">
      <VChip
        color="success"
        label
        size="small"
        class="mr-2"
      >
        {{ t('coreDam.asset.assetFilePublicLink.status.public') }}
      </VChip>
      <VBtn
        variant="text"
        size="small"
        :href="previewLink"
        target="_blank"
        rel="noopener noreferrer"
        class="text-left mr-2"
      >
        {{ t('coreDam.asset.assetFilePublicLink.actions.openOnNewTab') }}
        <VIcon
          size="small"
          icon="mdi-open-in-new"
        />
      </VBtn>
      <VBtn
        size="small"
        variant="text"
        @click.stop="makePrivate"
      >
        {{ t('coreDam.asset.assetFilePublicLink.actions.makePrivate') }}
      </VBtn>
    </div>
  </div>
  <div v-else>
    <div class="d-flex align-center">
      <VChip
        color="primary"
        label
        size="small"
        class="mr-2"
      >
        {{ t('coreDam.asset.assetFilePublicLink.status.private') }}
      </VChip>
      <VBtn
        size="small"
        variant="text"
        @click.stop="makePublic"
      >
        {{ t('coreDam.asset.assetFilePublicLink.actions.makePublic') }}
      </VBtn>
    </div>
  </div>
</template>
