<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { useJobListActions } from '@/views/coreDam/job/composables/jobActions'
import JobDatatable from '@/views/coreDam/job/components/JobDatatable.vue'
import { ACL } from '@/types/Permission'
import { ref } from 'vue'
import JobCreateButton from '@/views/coreDam/job/components/JobCreateButton.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const datatable = ref<InstanceType<typeof JobDatatable> | null>(null)

const { listLoading } = useJobListActions()

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_JOB_CREATE">
        <JobCreateButton
          data-cy="button-create"
          disable-redirect
          @after-create="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <JobDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
