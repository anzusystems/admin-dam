<script lang="ts" setup>
import UserDatatable from '@/views/dam/user/components/UserDatatable.vue'
import { ACard } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { ref } from 'vue'
import { useUserListActions } from '@/views/dam/user/composables/userActions'

const { t } = useI18n()

const { listLoading } = useUserListActions()

const datatable = ref<InstanceType<typeof UserDatatable> | null>(null)
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.user.meta.list')" icon="mdi-account" />
  <ACard :loading="listLoading">
    <UserDatatable ref="datatable" />
  </ACard>
</template>
