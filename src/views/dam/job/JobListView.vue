<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { useJobListActions } from '@/views/dam/job/composables/jobActions'
import JobDatatable from '@/views/dam/job/components/JobDatatable.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { ACL } from '@/types/Permission'
import { ref } from 'vue'
import JobCreateButton from '@/views/dam/job/components/JobCreateButton.vue'

const { t } = useI18n()

const datatable = ref<InstanceType<typeof JobDatatable> | null>(null)

const { listLoading } = useJobListActions()

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('job.meta.list')" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_JOB_CREATE">
      <JobCreateButton data-cy="button-create" disable-redirect @after-create="afterCreate" />
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard :loading="listLoading">
    <JobDatatable ref="datatable" />
  </ACard>
</template>
