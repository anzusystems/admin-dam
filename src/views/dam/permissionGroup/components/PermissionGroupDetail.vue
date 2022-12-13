<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import { usePermissionGroupOneStore } from '@/stores/dam/permissionGroupStore'
import LazyUserChip from '@/views/dam/user/components/LazyUserChip.vue'
import PermissionList from '@/views/dam/permissionGroup/components/PermissionList.vue'

const { loaded, permissionGroup } = storeToRefs(usePermissionGroupOneStore())

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.permissionGroup.model.title')" :value="permissionGroup.title"></ARow>
        <ARow :title="t('coreDam.permissionGroup.model.description')" :value="permissionGroup.description"></ARow>
        <ARow :title="t('coreDam.permissionGroup.model.users')">
          <LazyUserChip
            class="mr-2 mt-2"
            v-for="userId in permissionGroup.users"
            :id="userId"
            :key="userId"
          ></LazyUserChip>
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.permissionGroup.model.id')">
          <ACopyText :value="permissionGroup.id"></ACopyText>
        </ARow>
        <AUserAndTimeTrackingFields :data="permissionGroup"></AUserAndTimeTrackingFields>
      </ACard>
    </VCol>
    <VCol cols="12">
      <ACard loader="detail">
        <ARow>
          <PermissionList v-if="loaded" v-model="permissionGroup.permissions" readonly></PermissionList>
        </ARow>
      </ACard>
    </VCol>
  </VRow>
</template>
