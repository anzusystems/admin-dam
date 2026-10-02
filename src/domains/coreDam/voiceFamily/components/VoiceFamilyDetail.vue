<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'
import { useVoiceFamilyOneStore } from '@/domains/coreDam/voiceFamily/store/voiceFamilyStore'

const { voiceFamily } = storeToRefs(useVoiceFamilyOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.voiceFamily.model.displayName')"
        :value="voiceFamily.displayName"
      />
      <ARow
        :title="t('coreDam.voiceFamily.model.slug')"
        :value="voiceFamily.slug"
      />
      <ARow
        :title="t('coreDam.voiceFamily.model.language')"
        :value="voiceFamily.language"
      />
      <ARow
        :title="t('coreDam.voiceFamily.model.preferredProvider')"
        :value="voiceFamily.preferredProvider ?? '-'"
      />
      <ARow :title="t('coreDam.voiceFamily.model.active')">
        <ABooleanValue :value="voiceFamily.active" />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.voiceFamily.model.id')">
        <ACopyText :value="voiceFamily.id" />
      </ARow>
      <DamTrackingFields :data="voiceFamily" />
    </VCol>
  </VRow>
</template>
