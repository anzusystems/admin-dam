<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ACard } from '@anzusystems/common-admin'
import TtsNarrationRequestSynthesizeButton from '@/views/coreDam/ttsNarrationRequest/components/TtsNarrationRequestSynthesizeButton.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ROUTE } from '@/router/routes'
import { ACL } from '@/composables/auth/auth'
import type { TtsNarrationRequest } from '@/types/coreDam/TtsNarrationRequest'

const router = useRouter()
const { t } = useI18n()

const afterSynthesize = (request: TtsNarrationRequest) => {
  router.push({ name: ROUTE.DAM.TTS_NARRATION_REQUEST.DETAIL, params: { id: request.id } })
}
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_TTS_NARRATION_REQUEST_SYNTHESIZE">
        <TtsNarrationRequestSynthesizeButton
          data-cy="button-synthesize"
          @on-success="afterSynthesize"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard>
    <VCardText class="text-medium-emphasis">
      {{ t('coreDam.ttsNarrationRequest.synthesize.landingHint') }}
    </VCardText>
  </ACard>
</template>
