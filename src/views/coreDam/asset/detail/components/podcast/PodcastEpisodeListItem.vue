<script setup lang="ts">
import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'
import CachedPodcastChip from '@/views/coreDam/podcast/components/CachedPodcastChip.vue'
import type { DocId } from '@anzusystems/common-admin'
import { AActionDeleteButton } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import PodcastLastImportStatusChip from '@/views/coreDam/podcast/components/PodcastLastImportStatusChip.vue'

withDefaults(
  defineProps<{
    item: PodcastEpisode
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'deleteRecord', id: DocId): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="d-flex align-center w-100 pa-4 pb-8 text-body-2">
    <div class="w-100">
      <div class="font-weight-bold">
        {{ item.texts.title }}
      </div>
      <div>{{ t('coreDam.podcastEpisode.model.podcast') }}: <CachedPodcastChip :id="item.podcast" /></div>
      <div class="pt-1">
        {{ t('coreDam.podcastEpisode.model.attributes.lastImportStatus') }}:
        <PodcastLastImportStatusChip :status="item.attributes.lastImportStatus" />
      </div>
    </div>
    <div>
      <AActionDeleteButton @delete-record="emit('deleteRecord', item.id)" />
    </div>
  </div>
</template>
