<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import KeywordCreateButton from '@/views/dam/keyword/components/KeywordCreateButton.vue'
import KeywordDatatable from '@/views/dam/keyword/components/KeywordDatatable.vue'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.author.meta.list')" icon="mdi-file-key-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_KEYWORD_CREATE">
      <KeywordCreateButton data-cy="button-create"></KeywordCreateButton>
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard loader="list">
    <KeywordDatatable></KeywordDatatable>
  </ACard>
</template>
