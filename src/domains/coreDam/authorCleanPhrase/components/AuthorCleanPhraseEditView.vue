<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import AuthorCleanPhraseEditForm from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseEditForm.vue'
import { useAuthorCleanPhraseEditActions } from '@/domains/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const {
  detailLoading,
  fetchData,
  resetStore,
  onUpdate,
  saveButtonLoading,
  saveAndCloseButtonLoading,
  authorCleanPhrase,
} = useAuthorCleanPhraseEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.authorCleanPhrase.list'), routeName: '/(coreDam)/author-clean-phrases' },
    {
      title: authorCleanPhrase.value.phrase || t('breadcrumb.coreDam.authorCleanPhrase.edit'),
      routeName: '/(coreDam)/author-clean-phrases/[id]/edit',
    },
  ])
)

// Not the Close button's fallback: that is this record's detail, which failed to load just as well.
const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/author-clean-phrases',
  skipRouteNames: ['/(coreDam)/author-clean-phrases/[id]'],
  loading: detailLoading,
})

onMounted(async () => {
  if ((await fetchData(id, { signal })) === false) await leave()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/author-clean-phrases/[id]'"
        :fallback-route-params="{ id: id }"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorCleanPhraseEditForm />
    </VCardText>
  </ACard>
</template>
