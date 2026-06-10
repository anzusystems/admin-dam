<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { ref } from 'vue'
import VoiceFamilyCreateButton from '@/views/coreDam/voiceFamily/components/VoiceFamilyCreateButton.vue'
import VoiceFamilyDatatable from '@/views/coreDam/voiceFamily/components/VoiceFamilyDatatable.vue'
import { useVoiceFamilyListActions } from '@/views/coreDam/voiceFamily/composables/voiceFamilyActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { listLoading } = useVoiceFamilyListActions()

const datatable = ref<InstanceType<typeof VoiceFamilyDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_TTS_VOICE_FAMILY_CREATE">
        <VoiceFamilyCreateButton
          data-cy="button-create"
          @on-success="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <VoiceFamilyDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
