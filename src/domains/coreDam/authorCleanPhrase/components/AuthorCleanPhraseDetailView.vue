<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import AuthorCleanPhraseDetail from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseDetail.vue'
import {
  useAuthorCleanPhraseDetailActions,
  useAuthorCleanPhraseRemoveActions,
} from '@/domains/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import { useAuth } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { SYSTEM_DAM } from '@/shared/systems'

const { detailLoading, fetchData, resetStore, authorCleanPhrase } = useAuthorCleanPhraseDetailActions()
const { useCurrentUser } = useAuth()
const { isSuperAdmin } = useCurrentUser(SYSTEM_DAM)
const { removeAuthorCleanPhrase } = useAuthorCleanPhraseRemoveActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.authorCleanPhrase.list'), routeName: '/(coreDam)/author-clean-phrases' },
    {
      title: authorCleanPhrase.value.phrase || t('breadcrumb.coreDam.authorCleanPhrase.detail'),
      routeName: '/(coreDam)/author-clean-phrases/[id]',
    },
  ])
)

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/author-clean-phrases',
  skipRouteNames: ['/(coreDam)/author-clean-phrases/[id]/edit'],
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
      <!-- TODO(BE): core-dam checks dam_authorCleanPhrase_update and _delete without the record, a 403 for all but a
           super admin; gate on the keys once the checks take the record (ACL BE task 3.11). -->
      <template v-if="isSuperAdmin">
        <AActionEditButton
          v-if="!detailLoading"
          :route-params="{ id: id }"
          :route-name="'/(coreDam)/author-clean-phrases/[id]/edit'"
        />
        <AActionDeleteButton
          v-if="!detailLoading"
          data-cy="button-delete"
          @delete-record="removeAuthorCleanPhrase(id)"
        />
      </template>
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/author-clean-phrases'"
        :skip-route-names="['/(coreDam)/author-clean-phrases/[id]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorCleanPhraseDetail />
    </VCardText>
  </ACard>
</template>
