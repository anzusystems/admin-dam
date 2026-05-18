<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useVoiceFamilyOneStore } from '@/stores/coreDam/voiceFamilyStore'

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
      <AUserAndTimeTrackingFields :data="voiceFamily" />
    </VCol>
  </VRow>
</template>
