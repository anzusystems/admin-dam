<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import { useExtSystemOneStore } from '@/stores/dam/extSystemStore'
import LazyUserChip from '@/views/dam/user/components/LazyUserChip.vue'

const { extSystem } = storeToRefs(useExtSystemOneStore())

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.extSystem.model.name')" :value="extSystem.name" />
        <ARow :title="t('coreDam.extSystem.model.slug')" :value="extSystem.slug" />
        <ARow :title="t('coreDam.extSystem.model.adminUsers')">
          <LazyUserChip class="mr-2 mt-2" v-for="userId in extSystem.adminUsers" :id="userId" :key="userId" />
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.extSystem.model.id')">
          <ACopyText :value="extSystem.id" />
        </ARow>
        <AUserAndTimeTrackingFields :data="extSystem" />
      </ACard>
    </VCol>
  </VRow>
</template>
