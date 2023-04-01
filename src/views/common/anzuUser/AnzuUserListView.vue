<script lang="ts" setup>
import { ACL } from '@/types/Permission'
import { ref } from 'vue'
import { damClient } from '@/services/api/clients/damClient'
import AnzuUserDatatable from '@/views/common/anzuUser/components/AnzuUserDatatable.vue'
import AnzuUserCreateButton from '@/views/common/anzuUser/components/AnzuUserCreateButton.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import { ACard } from '@anzusystems/common-admin'

const datatable = ref<InstanceType<typeof AnzuUserDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
const { listLoading } = useAnzuUserActions(damClient)
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

  <ACard :loading="listLoading">
    <VCardText>
      <AnzuUserDatatable
        ref="datatable"
      />
    </VCardText>
  </ACard>
</template>
