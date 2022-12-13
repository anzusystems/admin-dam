<script lang="ts" setup>
import UserDatatable from '@/views/dam/user/components/UserDatatable.vue'
import ACard from '@/components/common/ACard.vue'
import UserCreateButton from '@/views/dam/user/components/UserCreateButton.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.user.meta.list')" icon="mdi-account" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_USER_CREATE">
      <UserCreateButton data-cy="button-create"></UserCreateButton>
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard loader="list">
    <UserDatatable></UserDatatable>
  </ACard>
</template>
