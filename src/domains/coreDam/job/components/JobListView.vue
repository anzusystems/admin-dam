<script lang="ts" setup>
import { ACard, useI18n } from '@anzusystems/common-admin'
import { useJobListActions } from '@/domains/coreDam/job/composables/jobActions'
import JobDatatable from '@/domains/coreDam/job/components/JobDatatable.vue'
import JobCreateButton from '@/domains/coreDam/job/components/JobCreateButton.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

const datatable = ref<InstanceType<typeof JobDatatable> | null>(null)

const { listLoading } = useJobListActions()

const afterCreate = () => {
  datatable.value?.refresh()
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.coreDam.job.list'), routeName: '/(coreDam)/jobs' }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_JOB_CREATE">
        <JobCreateButton
          data-cy="button-create"
          @on-success="afterCreate"
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
