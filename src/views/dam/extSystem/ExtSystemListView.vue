<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import ExtSystemDatatable from '@/views/dam/extSystem/components/ExtSystemDatatable.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useExtSystemListActions } from '@/views/dam/extSystem/composables/extSystemActions'

const { t } = useI18n({ useScope: 'global' })

const { listLoading } = useExtSystemListActions()
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.extSystem.meta.list')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper />
  <ACard :loading="listLoading">
    <ExtSystemDatatable />
  </ACard>
</template>
