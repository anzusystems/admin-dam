<script lang="ts" setup>
import { ACard, defineBreadcrumbs } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AuthorCleanPhraseCreateButton from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseCreateButton.vue'
import AuthorCleanPhraseDatatable from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseDatatable.vue'
import AuthorCleanPhrasePlaygroundButton from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhrasePlaygroundButton.vue'
import { useAuthorCleanPhraseListActions } from '@/domains/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import { useAuth } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { SYSTEM_DAM } from '@/shared/systems'

const { listLoading } = useAuthorCleanPhraseListActions()

const { useCurrentUser } = useAuth()
const { isSuperAdmin } = useCurrentUser(SYSTEM_DAM)

const datatable = ref<InstanceType<typeof AuthorCleanPhraseDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.authorCleanPhrase.list'), routeName: '/(coreDam)/author-clean-phrases' },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <!-- TODO(BE): core-dam checks dam_authorCleanPhrase_create and _read (playground) without the record, a 403 for
           all but a super admin; gate on the keys once the checks take the record (ACL BE task #86852/3.11). -->
      <template v-if="isSuperAdmin">
        <AuthorCleanPhraseCreateButton
          data-cy="button-create"
          disable-redirect
          @on-success="afterCreate"
        />
        <AuthorCleanPhrasePlaygroundButton data-cy="button-playground" />
      </template>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <AuthorCleanPhraseDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
