<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useExtSystemOneStore } from '@/stores/coreDam/extSystemStore'
import ACachedAnzuUserChip from '@/components/ACachedAnzuUserChip.vue'

const { extSystem } = storeToRefs(useExtSystemOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.extSystem.model.name')"
        :value="extSystem.name"
      />
      <ARow
        :title="t('coreDam.extSystem.model.slug')"
        :value="extSystem.slug"
      />
      <ARow :title="t('coreDam.extSystem.model.adminUsers')">
        <ACachedAnzuUserChip
          v-for="userId in extSystem.adminUsers"
          :id="userId"
          :key="userId"
          class="mr-2 mt-2"
        />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.extSystem.model.id')">
        <ACopyText :value="extSystem.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="extSystem" />
    </VCol>
  </VRow>
</template>
