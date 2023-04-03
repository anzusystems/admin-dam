<script lang="ts" setup>
import UserDatatable from '@/views/coreDam/user/components/UserDatatable.vue'
import { ACard } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useUserListActions } from '@/views/coreDam/user/composables/userActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { listLoading } = useUserListActions()

const datatable = ref<InstanceType<typeof UserDatatable> | null>(null)
</script>

<template>
  <ActionbarWrapper />

  <ACard :loading="listLoading">
    <VCardText>
      <UserDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
