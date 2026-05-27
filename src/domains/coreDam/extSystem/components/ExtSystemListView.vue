<script lang="ts" setup>
import { ACard, useI18n } from '@anzusystems/common-admin'
import ExtSystemDatatable from '@/domains/coreDam/extSystem/components/ExtSystemDatatable.vue'
import { useExtSystemListActions } from '@/domains/coreDam/extSystem/composables/extSystemActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { listLoading } = useExtSystemListActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.coreDam.extSystem.list'), routeName: '/(coreDam)/ext-systems' }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs" />

  <ACard :loading="listLoading">
    <VCardText>
      <ExtSystemDatatable />
    </VCardText>
  </ACard>
</template>
