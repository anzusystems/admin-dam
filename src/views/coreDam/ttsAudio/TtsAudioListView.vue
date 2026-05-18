<script lang="ts" setup>
import { ref } from 'vue'
import { ACard } from '@anzusystems/common-admin'
import TtsAudioDatatable from '@/views/coreDam/ttsAudio/components/TtsAudioDatatable.vue'
import TtsAudioSynthesizeButton from '@/views/coreDam/ttsAudio/components/TtsAudioSynthesizeButton.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { useTtsAudioListActions } from '@/views/coreDam/ttsAudio/composables/ttsAudioActions'
import { ACL } from '@/composables/auth/auth'

const { listLoading } = useTtsAudioListActions()

const datatable = ref<InstanceType<typeof TtsAudioDatatable> | null>(null)

const afterSynthesize = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_TTS_AUDIO_SYNTHESIZE">
        <TtsAudioSynthesizeButton
          data-cy="button-synthesize"
          @on-success="afterSynthesize"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <TtsAudioDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
