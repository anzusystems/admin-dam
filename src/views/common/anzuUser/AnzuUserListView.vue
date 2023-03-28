<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import { ref } from 'vue'
import { damClient } from '@/services/api/clients/damClient'
import AnzuUserDatatable from '@/views/common/anzuUser/components/AnzuUserDatatable.vue'
import AnzuUserCreateButton from '@/views/common/anzuUser/components/AnzuUserCreateButton.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const datatable = ref<InstanceType<typeof AnzuUserDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_USER_CREATE">
        <AnzuUserCreateButton
          data-cy="button-create"
          disable-redirect
          :client="damClient"
          @after-create="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <AnzuUserDatatable
    ref="datatable"
    :client="damClient"
  />
</template>
