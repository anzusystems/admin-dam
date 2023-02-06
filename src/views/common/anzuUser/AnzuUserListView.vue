<script lang="ts" setup>
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { ref } from 'vue'
import { damClient } from '@/services/api/clients/damClient'
import AnzuUserDatatable from '@/views/common/anzuUser/components/AnzuUserDatatable.vue'
import AnzuUserCreateButton from '@/views/common/anzuUser/components/AnzuUserCreateButton.vue'

const { t } = useI18n({ useScope: 'global' })

const datatable = ref<InstanceType<typeof AnzuUserDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('common.anzuUser.meta.list')" icon="mdi-account-edit-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_USER_CREATE">
      <AnzuUserCreateButton data-cy="button-create" :client="damClient" @after-create="afterCreate" />
    </Acl>
  </ActionbarButtonsWrapper>
  <AnzuUserDatatable ref="datatable" :client="damClient" />
</template>
