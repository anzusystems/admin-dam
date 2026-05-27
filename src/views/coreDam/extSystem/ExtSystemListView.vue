<script lang="ts" setup>
import { ACard, defineBreadcrumbs, useI18n } from '@anzusystems/common-admin'
import { computed } from 'vue'
import ExtSystemDatatable from '@/views/coreDam/extSystem/components/ExtSystemDatatable.vue'
import { useExtSystemListActions } from '@/views/coreDam/extSystem/composables/extSystemActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { listLoading } = useExtSystemListActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.coreDam.extSystem.list'), routeName: '/(coreDam)/ext-system' }])
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
