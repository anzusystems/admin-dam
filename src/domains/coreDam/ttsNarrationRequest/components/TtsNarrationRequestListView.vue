<script lang="ts" setup>
import { ref } from 'vue'
import { ACard } from '@anzusystems/common-admin'
import TtsNarrationRequestDatatable from '@/domains/coreDam/ttsNarrationRequest/components/TtsNarrationRequestDatatable.vue'
import TtsNarrationRequestSynthesizeButton from '@/domains/coreDam/ttsNarrationRequest/components/TtsNarrationRequestSynthesizeButton.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { useTtsNarrationRequestListActions } from '@/domains/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'
import { ACL } from '@/domains/system/auth/auth'

const { listLoading } = useTtsNarrationRequestListActions()

const datatable = ref<InstanceType<typeof TtsNarrationRequestDatatable> | null>(null)

const afterSynthesize = () => {
  datatable.value?.refresh()
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

  <ACard :loading="listLoading">
    <VCardText>
      <TtsNarrationRequestDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
