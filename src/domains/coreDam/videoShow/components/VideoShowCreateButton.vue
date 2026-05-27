<script lang="ts" setup>
import { ACreateDialog, AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { createVideoShow, ENTITY } from '@/domains/coreDam/videoShow/api/videoShowApi'
import { useVideoShowFactory } from '@/domains/coreDam/videoShow/factory/VideoShowFactory'
import type { VideoShow } from '@/domains/coreDam/videoShow/types/VideoShow'
import { useVideoShowValidation } from '@/domains/coreDam/videoShow/composables/videoShowValidation'
import { useCurrentAssetLicence } from '@/domains/coreDam/asset/composables/currentExtSystem'

withDefaults(
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
  (e: 'onSuccess', data: VideoShow): void
}>()

const { currentAssetLicenceId } = useCurrentAssetLicence()

const { createDefault } = useVideoShowFactory()
const videoShow = ref<VideoShow>(createDefault(currentAssetLicenceId.value))
const dialog = ref(false)

const { v$ } = useVideoShowValidation(videoShow)
const { t } = useI18n()

const onOpen = () => {
  videoShow.value = createDefault(currentAssetLicenceId.value)
}

const create = async () => {
  return await createVideoShow(videoShow.value)
}
</script>

<template>
  <ACreateDialog
    v-model="dialog"
    :v="v$"
    :call-create="create"
    disable-redirect
    :button-class="buttonClass"
    :data-cy="dataCy"
    :max-width="500"
    @on-open="onOpen"
    @on-success="emit('onSuccess', $event)"
    @on-close="dialog = false"
  >
    <template #title>
      {{ t('coreDam.videoShow.meta.create') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <ARow>
          <AFormTextField
            v-model="videoShow.texts.title"
            :label="t('coreDam.videoShow.model.texts.title')"
            :v="v$.videoShow.texts.title"
            data-cy="videoShow-title"
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
