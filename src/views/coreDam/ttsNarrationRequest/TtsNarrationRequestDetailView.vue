<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  AActionCloseButton,
  ABooleanValue,
  ACard,
  ACopyText,
  ADatetime,
  ARow,
  AUserAndTimeTrackingFields,
  type DocId,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import {
  isCancellableRequest,
  useTtsNarrationRequestDetailActions,
} from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'
import TtsCancelRequestDialog from '@/views/coreDam/ttsNarrationRequest/dialogs/TtsCancelRequestDialog.vue'
import { ACL } from '@/composables/auth/auth'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import TtsRequestStatusChip from '@/views/coreDam/ttsNarrationRequest/components/TtsRequestStatusChip.vue'
import TtsRequestModeChip from '@/views/coreDam/ttsNarrationRequest/components/TtsRequestModeChip.vue'
import TtsAudioStatusChip from '@/views/coreDam/ttsNarrationRequest/components/TtsAudioStatusChip.vue'
import VoiceDiscriminatorChip from '@/views/coreDam/voiceFamily/components/VoiceDiscriminatorChip.vue'
import CachedVoiceFamilyChip from '@/views/coreDam/voiceFamily/components/CachedVoiceFamilyChip.vue'
import CachedAssetLicenceChip from '@/views/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'
import CachedExtSystemChip from '@/views/coreDam/extSystem/components/CachedExtSystemChip.vue'
import AssetChip from '@/views/coreDam/asset/detail/components/AssetChip.vue'

const route = useRoute()
const { t } = useI18n()

const { detail, detailLoading, fetchDetail } = useTtsNarrationRequestDetailActions(() => route.params.id as DocId)
const cancelDialog = ref(false)

onMounted(fetchDetail)
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="detail?.id ?? ''">
    <template #buttons>
      <Acl :permission="ACL.DAM_TTS_NARRATION_REQUEST_CANCEL">
        <VBtn
          v-if="detail && isCancellableRequest(detail)"
          color="error"
          variant="text"
          prepend-icon="mdi-cancel"
          class="mr-2"
          data-cy="button-cancel-request"
          @click.stop="cancelDialog = true"
        >
          {{ t('coreDam.ttsNarrationRequest.button.cancelRequest') }}
        </VBtn>
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.TTS_NARRATION_REQUEST.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard
    :loading="detailLoading"
    :title="t('coreDam.ttsNarrationRequest.detail.requestSection')"
  >
    <VCardText v-if="detail">
      <VRow>
        <VCol cols="8">
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.id')">
            <ACopyText :value="detail.id" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.status')">
            <TtsRequestStatusChip :status="detail.status" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.mode')">
            <TtsRequestModeChip :mode="detail.mode" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.extSystemId')">
            <CachedExtSystemChip :id="detail.extSystemId" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetLicence')">
            <CachedAssetLicenceChip :id="detail.assetLicence" />
          </ARow>
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.voiceFamilySlug')"
            :value="detail.voiceFamilySlug"
          />
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.title')"
            :value="detail.title"
          />
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetId')">
            <template v-if="detail.assetId">
              <AssetChip :id="detail.assetId" />
            </template>
            <template v-else>
              —
            </template>
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.cancelRequested')">
            <ABooleanValue
              chip
              :value="detail.cancelRequested"
            />
          </ARow>
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.failureReason')"
            :value="detail.failureReason"
          />
        </VCol>
        <VCol cols="4">
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.startedAt')">
            <ADatetime :date-time="detail.startedAt" />
          </ARow>
          <AUserAndTimeTrackingFields :data="detail" />
        </VCol>
      </VRow>
    </VCardText>
  </ACard>

  <ACard
    v-if="detail?.ttsAsset"
    :title="t('coreDam.ttsNarrationRequest.detail.ttsAssetSection')"
    class="mt-4"
  >
    <VCardText>
      <VRow>
        <VCol cols="8">
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetAssetId')">
            <AssetChip :id="detail.ttsAsset.assetId" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetDiscriminator')">
            <VoiceDiscriminatorChip :discriminator="detail.ttsAsset.provider" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetVoiceFamilyId')">
            <CachedVoiceFamilyChip :id="detail.ttsAsset.voiceFamily" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.externalVoiceId')">
            <ACopyText :value="detail.ttsAsset.externalVoiceId" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetStatus')">
            <TtsAudioStatusChip :status="detail.ttsAsset.status" />
          </ARow>
          <ARow
            :title="t('coreDam.ttsNarrationRequest.detail.fields.assetFailureReason')"
            :value="detail.ttsAsset.failureReason"
          />
        </VCol>
        <VCol cols="4">
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetCreatedAt')">
            <ADatetime :date-time="detail.ttsAsset.createdAt" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.assetModifiedAt')">
            <ADatetime :date-time="detail.ttsAsset.modifiedAt" />
          </ARow>
          <ARow :title="t('coreDam.ttsNarrationRequest.detail.fields.sourceTextHash')">
            <ACopyText :value="detail.ttsAsset.sourceTextHash" />
          </ARow>
        </VCol>
      </VRow>
    </VCardText>
  </ACard>

  <ACard
    v-else-if="!detailLoading"
    :title="t('coreDam.ttsNarrationRequest.detail.ttsAssetSection')"
    class="mt-4"
  >
    <VCardText>
      <p>{{ t('coreDam.ttsNarrationRequest.detail.noTtsAsset') }}</p>
    </VCardText>
  </ACard>

  <TtsCancelRequestDialog
    v-model="cancelDialog"
    :request-id="detail?.id ?? null"
    @on-success="fetchDetail"
  />
</template>
