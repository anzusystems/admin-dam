<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/podcastApi'
import { useI18n } from 'vue-i18n'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import { usePodcastEditActions } from '@/views/dam/podcast/composables/podcastActions'
import { usePodcastValidation } from '@/views/dam/podcast/composables/podcastValidation'
import { usePodcastMode } from '@/model/dam/valueObject/PodcastMode'
import AValueObjectOptionsSelect from '@/components/form/AValueObjectOptionsSelect.vue'
import ATextarea from '@/components/form/ATextarea.vue'
import ImagePreview from '@/views/dam/asset/components/ImagePreview.vue'

const { podcast } = usePodcastEditActions()

const { v$ } = usePodcastValidation(podcast)

const { t } = useI18n({ useScope: 'global' })

const { podcastModeOptions } = usePodcastMode()
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <ATextField
            :label="t('coreDam.podcast.model.texts.title')"
            v-model="podcast.texts.title"
            :v="v$.podcast.texts.title"
          ></ATextField>
        </ARow>
        <ARow>
          <ATextarea
            :label="t('coreDam.podcast.model.texts.description')"
            v-model="podcast.texts.description"
            :v="v$.podcast.texts.description"
          ></ATextarea>
        </ARow>
        <ARow>
          <AValueObjectOptionsSelect
            :label="t('coreDam.podcast.model.attributes.mode')"
            v-model="podcast.attributes.mode"
            :items="podcastModeOptions"
          ></AValueObjectOptionsSelect>
        </ARow>
        <ARow>
          <ATextField
            :label="t('coreDam.podcast.model.attributes.rssUrl')"
            v-model="podcast.attributes.rssUrl"
            :v="v$.podcast.attributes.rssUrl"
          ></ATextField>
        </ARow>
        <ARow>
          <ImagePreview v-model="podcast.imagePreview" show-actions />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
