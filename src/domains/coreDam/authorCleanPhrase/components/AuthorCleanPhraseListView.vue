<script lang="ts" setup>
import { ACard, defineBreadcrumbs } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AuthorCleanPhraseCreateButton from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseCreateButton.vue'
import AuthorCleanPhraseDatatable from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseDatatable.vue'
import AuthorCleanPhrasePlaygroundButton from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhrasePlaygroundButton.vue'
import { useAuthorCleanPhraseListActions } from '@/domains/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { listLoading } = useAuthorCleanPhraseListActions()

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
      <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_CREATE">
        <AuthorCleanPhraseCreateButton
          data-cy="button-create"
          disable-redirect
          @on-success="afterCreate"
        />
      </Acl>
      <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_READ">
        <AuthorCleanPhrasePlaygroundButton data-cy="button-playground" />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <AuthorCleanPhraseDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
