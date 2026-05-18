<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ABooleanValue, ADatatablePagination, ADatetime, useAlerts, usePagination } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { fetchVoiceListByFamily, deleteVoice } from '@/services/api/coreDam/voiceApi'
import type { Voice } from '@/types/coreDam/Voice'
import VoiceBindingCreateDialog from '@/views/coreDam/voiceFamily/dialogs/VoiceBindingCreateDialog.vue'
import VoiceBindingEditDialog from '@/views/coreDam/voiceFamily/dialogs/VoiceBindingEditDialog.vue'
import { ACL } from '@/composables/auth/auth'

const props = withDefaults(
  defineProps<{
    voiceFamilyId: DocId
  }>(),
  {}
)

const { t } = useI18n()
const { showRecordWas, showErrorsDefault } = useAlerts()

const voices = ref<Voice[]>([])
const loading = ref(false)
const editDialog = ref(false)
const selectedVoice = ref<Voice | null>(null)
const pagination = usePagination()
const filterBag = {}

const fetchVoices = async () => {
  loading.value = true
  try {
    voices.value = await fetchVoiceListByFamily(props.voiceFamilyId, pagination, filterBag)
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    loading.value = false
  }
}

const onEditVoice = (voice: Voice) => {
  selectedVoice.value = voice
  editDialog.value = true
}

const onDeleteVoice = async (voice: Voice) => {
  try {
    await deleteVoice(voice.id)
    showRecordWas('deleted')
    await fetchVoices()
  } catch (error) {
    showErrorsDefault(error)
  }
}

const onCreateSuccess = async () => {
  await fetchVoices()
}

const onEditSuccess = async () => {
  await fetchVoices()
}

onMounted(() => {
  fetchVoices()
})
</script>

<template>
  <div>
    <div class="d-flex align-center mb-2">
      <VSpacer />
      <Acl :permission="ACL.DAM_TTS_VOICE_CREATE">
        <VoiceBindingCreateDialog
          :voice-family-id="voiceFamilyId"
          @on-success="onCreateSuccess"
        />
      </Acl>
    </div>
    <VDataTableServer
      class="a-datatable"
      :loading="loading"
      :headers="[
        { title: t('coreDam.voice.model.provider'), key: 'provider', sortable: false },
        { title: t('coreDam.voice.model.externalVoiceId'), key: 'externalVoiceId', sortable: false },
        { title: t('coreDam.voice.model.primary'), key: 'primary', sortable: false },
        { title: t('coreDam.voice.model.active'), key: 'active', sortable: false },
        { title: t('coreDam.voice.model.modifiedAt'), key: 'modifiedAt', sortable: false },
        { title: '', key: 'actions', sortable: false, align: 'end' },
      ]"
      :items="voices"
      :items-length="pagination.totalCount"
      item-value="id"
    >
      <template #item.primary="{ item }: { item: Voice }">
        <ABooleanValue
          chip
          :value="item.primary"
        />
      </template>
      <template #item.active="{ item }: { item: Voice }">
        <ABooleanValue
          chip
          :value="item.active"
        />
      </template>
      <template #item.modifiedAt="{ item }: { item: Voice }">
        <ADatetime :date-time="item.modifiedAt" />
      </template>
      <template #item.actions="{ item }: { item: Voice }">
        <div class="d-flex justify-end">
          <Acl :permission="ACL.DAM_TTS_VOICE_UPDATE">
            <VBtn
              icon
              size="small"
              variant="text"
              @click.stop="onEditVoice(item)"
            >
              <VIcon>mdi-pencil</VIcon>
            </VBtn>
          </Acl>
          <Acl :permission="ACL.DAM_TTS_VOICE_DELETE">
            <VBtn
              icon
              size="small"
              variant="text"
              color="error"
              :title="t('common.system.delete')"
              @click.stop="onDeleteVoice(item)"
            >
              <VIcon>mdi-trash-can-outline</VIcon>
            </VBtn>
          </Acl>
        </div>
      </template>
      <template #bottom>
        <ADatatablePagination
          v-model="pagination"
          @change="fetchVoices"
        />
      </template>
    </VDataTableServer>

    <VoiceBindingEditDialog
      v-model="editDialog"
      :voice="selectedVoice"
      @on-success="onEditSuccess"
    />
  </div>
</template>
