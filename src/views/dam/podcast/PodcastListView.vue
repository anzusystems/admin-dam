<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import PodcastCreateButton from '@/views/dam/podcast/components/PodcastCreateButton.vue'
import PodcastDatatable from '@/views/dam/podcast/components/PodcastDatatable.vue'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.podcast.meta.list')" icon="mdi-podcast" />
  <ActionbarButtonsWrapper>
    <PodcastCreateButton data-cy="button-create"></PodcastCreateButton>
  </ActionbarButtonsWrapper>
  <ACard loader="list">
    <PodcastDatatable />
  </ACard>
</template>
