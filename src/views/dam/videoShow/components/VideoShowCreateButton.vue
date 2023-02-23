<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlerts } from '@anzusystems/common-admin'
import { useErrorHandler } from '@/composables/system/error'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createVideoShow, ENTITY } from '@/services/api/dam/videoShowApi'
import { useVideoShowFactory } from '@/model/dam/factory/VideoShowFactory'
import type { VideoShow } from '@/types/dam/VideoShow'
import { useVideoShowValidation } from '@/views/dam/videoShow/composables/videoShowValidation'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'
import { isUndefined } from '@/utils/common'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    disableRedirect?: boolean
    buttonT?: string
    buttonClass?: string
    dataCy?: string
    disabled?: boolean | undefined
  }>(),
  {
    disableRedirect: false,
    buttonT: 'common.button.create',
    buttonClass: 'ml-2',
    dataCy: '',
    disabled: undefined,
  }
)
const emit = defineEmits<{
  (e: 'afterCreate', data: VideoShow): void
}>()

const { currentAssetLicenceId } = useCurrentAssetLicence()

const { createDefault } = useVideoShowFactory()
const videoShow = ref<VideoShow>(createDefault(currentAssetLicenceId.value))
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  videoShow.value = createDefault(currentAssetLicenceId.value)
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = useVideoShowValidation(videoShow)
const { t } = useI18n()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const onConfirm = async () => {
  try {
    buttonLoading.value = true
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      buttonLoading.value = false
      return
    }
    const res = await createVideoShow(videoShow.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.VIDEO_SHOW.DETAIL, params: { id: res.id } })
    }
  } catch (error) {
    handleError(error)
  } finally {
    buttonLoading.value = false
  }
}
</script>

<template>
  <VBtn
    :class="buttonClass"
    :data-cy="dataCy"
    color="success"
    :disabled="disabled"
    rounded="pill"
    @click.stop="onClick"
  >
    {{ t(buttonT) }}
  </VBtn>
  <VDialog v-model="dialog" persistent>
    <VCard v-if="dialog" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('coreDam.videoShow.meta.create') }}</span>
        <VSpacer />
        <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" data-cy="button-close" @click.stop="onCancel" />
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <ATextField
              v-model="videoShow.texts.title"
              :label="t('coreDam.videoShow.model.texts.title')"
              :v="v$.videoShow.texts.title"
              data-cy="videoShow-title"
            />
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="success" :loading="buttonLoading" data-cy="button-create-video-show" @click.stop="onConfirm">
          {{ t(buttonT) }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
