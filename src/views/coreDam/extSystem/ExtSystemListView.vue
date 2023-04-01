<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import ExtSystemDatatable from '@/views/coreDam/extSystem/components/ExtSystemDatatable.vue'
import { useExtSystemListActions } from '@/views/coreDam/extSystem/composables/extSystemActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

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
