<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import ExtSystemDatatable from '@/views/coreDam/extSystem/components/ExtSystemDatatable.vue'
import { useI18n } from 'vue-i18n'
import { useExtSystemListActions } from '@/views/coreDam/extSystem/composables/extSystemActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { t } = useI18n()

const { listLoading } = useExtSystemListActions()
</script>

<template>
  <ActionbarWrapper />

  <ACard :loading="listLoading">
    <VCardText>
      <ExtSystemDatatable />
    </VCardText>
  </ACard>
</template>
