<script lang="ts" setup>
import UserDatatable from '@/views/coreDam/user/components/UserDatatable.vue'
import { ACard } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { ref } from 'vue'
import { useUserListActions } from '@/views/coreDam/user/composables/userActions'

const { t } = useI18n()

const { listLoading } = useUserListActions()

const datatable = ref<InstanceType<typeof UserDatatable> | null>(null)
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.user.meta.list')" />
  <ACard :loading="listLoading">
    <UserDatatable ref="datatable" />
  </ACard>
</template>
