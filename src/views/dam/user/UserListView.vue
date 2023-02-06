<script lang="ts" setup>
import UserDatatable from '@/views/dam/user/components/UserDatatable.vue'
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { ref } from 'vue'

const { t } = useI18n({ useScope: 'global' })

const datatable = ref<InstanceType<typeof UserDatatable> | null>(null)
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.user.meta.list')" icon="mdi-account" />
  <ACard loader="list">
    <UserDatatable ref="datatable" />
  </ACard>
</template>
