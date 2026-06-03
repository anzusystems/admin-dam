<script lang="ts" setup>
import { ref } from 'vue'
import { ACard } from '@anzusystems/common-admin'
import TtsNarrationRequestDatatable from '@/views/coreDam/ttsNarrationRequest/components/TtsNarrationRequestDatatable.vue'
import TtsNarrationRequestSynthesizeButton from '@/views/coreDam/ttsNarrationRequest/components/TtsNarrationRequestSynthesizeButton.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { useTtsNarrationRequestListActions } from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'
import { ACL } from '@/composables/auth/auth'

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
