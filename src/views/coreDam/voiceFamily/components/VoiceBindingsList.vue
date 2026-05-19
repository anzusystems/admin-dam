<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ABooleanValue, ADatatablePagination, ADatetime, useAlerts, usePagination } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { fetchVoiceListByFamily, deleteVoice } from '@/services/api/coreDam/voiceApi'
import type { Voice } from '@/types/coreDam/Voice'
import VoiceBindingCreateDialog from '@/views/coreDam/voiceFamily/dialogs/VoiceBindingCreateDialog.vue'
import VoiceBindingEditDialog from '@/views/coreDam/voiceFamily/dialogs/VoiceBindingEditDialog.vue'
import VoiceDiscriminatorChip from '@/views/coreDam/voiceFamily/components/VoiceDiscriminatorChip.vue'
import { ACL, useAuth } from '@/composables/auth/auth'

const props = withDefaults(
  defineProps<{
    voiceFamilyId: DocId
  }>(),
  {}
)

const { t } = useI18n()
const { showRecordWas, showErrorsDefault } = useAlerts()
const { can } = useAuth()

const canEdit = computed(() => can(ACL.DAM_TTS_VOICE_UPDATE))
const canDelete = computed(() => can(ACL.DAM_TTS_VOICE_DELETE))

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

const onRowClick = (event: unknown, { item }: { item: Voice }) => {
  if (canEdit.value) onEditVoice(item)
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
        { title: t('coreDam.voice.model.discriminator'), key: 'discriminator', sortable: false },
        { title: t('coreDam.voice.model.externalVoiceId'), key: 'externalVoiceId', sortable: false },
        { title: t('coreDam.voice.model.main'), key: 'main', sortable: false },
        { title: t('coreDam.voice.model.active'), key: 'active', sortable: false },
        { title: t('coreDam.voice.model.modifiedAt'), key: 'modifiedAt', sortable: false },
        { title: '', key: 'actions', sortable: false, align: 'end' },
      ]"
      :items="voices"
      :items-length="pagination.totalCount"
      item-value="id"
      @click:row="onRowClick"
    >
      <template #item.discriminator="{ item }: { item: Voice }">
        <VoiceDiscriminatorChip :discriminator="item.discriminator" />
      </template>
      <template #item.main="{ item }: { item: Voice }">
        <ABooleanValue
          chip
          :value="item.main"
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
          <VBtn
            v-if="canEdit"
            variant="text"
            icon
            size="small"
            class="mx-1"
            @click.stop="onEditVoice(item)"
          >
            <VIcon icon="mdi-pencil" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('coreDam.voice.button.edit') }}
            </VTooltip>
          </VBtn>
          <VBtn
            v-if="canDelete"
            variant="text"
            icon
            size="small"
            class="mx-1"
          >
            <VIcon icon="mdi-dots-horizontal" />
            <VMenu activator="parent">
              <VCard min-width="200">
                <VList>
                  <VListItem
                    :title="t('coreDam.voice.button.delete')"
                    @click.stop="onDeleteVoice(item)"
                  />
                </VList>
              </VCard>
            </VMenu>
          </VBtn>
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
