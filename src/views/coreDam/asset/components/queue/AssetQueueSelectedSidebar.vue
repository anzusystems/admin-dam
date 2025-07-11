<script setup lang="ts">
import AssetCustomMetadataFormMassOperations from '@/components/coreDam/customMetadata/AssetCustomMetadataFormMassOperations.vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import AuthorRemoteAutocompleteWithCached from '@/views/coreDam/author/components/AuthorRemoteAutocompleteWithCached.vue'
import KeywordRemoteAutocompleteWithCached from '@/views/coreDam/keyword/components/KeywordRemoteAutocompleteWithCached.vue'
import {
  ASystemEntityScope,
  type CustomDataValue,
  DamAssetType,
  type DamAssetTypeType,
} from '@anzusystems/common-admin'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    queueId: string
  }>(),
  {}
)

const massOperationsData = ref<{
  image: Record<string, CustomDataValue>
  video: Record<string, CustomDataValue>
  audio: Record<string, CustomDataValue>
  document: Record<string, CustomDataValue>
}>({ image: {}, video: {}, audio: {}, document: {} })
const massOperationsKeywords = ref([])
const massOperationsAuthors = ref([])

const { t } = useI18n()

const panels = ref<Array<string>>(['general'])

const uploadQueuesStore = useUploadQueuesStore()

const fillEmptyField = (data: {
  assetType: DamAssetTypeType
  elementProperty: string
  value: CustomDataValue
}) => {
  uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(props.queueId, data)
}
const replaceField = (data: { assetType: DamAssetTypeType; elementProperty: string; value: CustomDataValue }) => {
  uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(props.queueId, data, true)
}
const fillEmptyKeywords = () => {
  uploadQueuesStore.queueItemsReplaceEmptyKeywords(props.queueId, massOperationsKeywords.value)
}
const replaceKeywords = () => {
  uploadQueuesStore.queueItemsReplaceEmptyKeywords(props.queueId, massOperationsKeywords.value, true)
}
const fillEmptyAuthors = () => {
  uploadQueuesStore.queueItemsReplaceEmptyAuthors(props.queueId, massOperationsAuthors.value)
}
const replaceAuthors = () => {
  uploadQueuesStore.queueItemsReplaceEmptyAuthors(props.queueId, massOperationsAuthors.value, true)
}
const fillAll = (forceReplace = false) => {
  for (const [elementProperty, value] of Object.entries(massOperationsData.value.image)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: DamAssetType.Image,
        elementProperty,
        value,
      },
      forceReplace
    )
  }
  for (const [elementProperty, value] of Object.entries(massOperationsData.value.video)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: DamAssetType.Video,
        elementProperty,
        value,
      },
      forceReplace
    )
  }
  for (const [elementProperty, value] of Object.entries(massOperationsData.value.audio)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: DamAssetType.Audio,
        elementProperty,
        value,
      },
      forceReplace
    )
  }
  for (const [elementProperty, value] of Object.entries(massOperationsData.value.document)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: DamAssetType.Document,
        elementProperty,
        value,
      },
      forceReplace
    )
  }
  if (forceReplace) {
    replaceAuthors()
    replaceKeywords()
    return
  }
  fillEmptyAuthors()
  fillEmptyKeywords()
}
const clearForm = () => {
  massOperationsData.value = { image: {}, video: {}, audio: {}, document: {} }
  massOperationsAuthors.value = []
  massOperationsKeywords.value = []
}

const assetTypes = computed(() => {
  return uploadQueuesStore.getQueueItemsTypes(props.queueId)
})

onMounted(() => {
  if (assetTypes.value[0]) {
    panels.value.push(assetTypes.value[0])
  }
})
</script>

<template>
  <div class="sidebar-info d-flex w-100 h-100 flex-column">
    <div class="w-100 d-flex flex-column">
      <VTabs class="sidebar-info__tabs">
        <VTab>{{ t('coreDam.asset.massOperations.title') }}</VTab>
      </VTabs>
      <div class="sidebar-info__content">
        <div class="text-caption pa-3">
          {{ t('coreDam.asset.massOperations.description') }}
        </div>
        <VExpansionPanels
          v-model="panels"
          multiple
          class="v-expansion-panels--compact"
        >
          <VExpansionPanel
            elevation="0"
            :title="t('coreDam.asset.massOperations.general')"
            value="general"
          >
            <VExpansionPanelText>
              <VRow
                dense
                class="my-2"
              >
                <VCol>
                  <ASystemEntityScope
                    subject="keyword"
                    system="dam"
                  >
                    <div class="d-flex">
                      <div style="min-width: 286px">
                        <KeywordRemoteAutocompleteWithCached
                          v-model="massOperationsKeywords"
                          :label="t('coreDam.asset.model.keywords')"
                          clearable
                          multiple
                          :validation-scope="false"
                        />
                      </div>
                      <VBtn
                        icon
                        size="small"
                        variant="text"
                        class="mr-1"
                        @click.stop="fillEmptyKeywords"
                      >
                        <VIcon icon="mdi-file-arrow-left-right-outline" />
                        <VTooltip
                          activator="parent"
                          location="bottom"
                        >
                          {{ t('coreDam.asset.massOperations.fillOneEmpty') }}
                        </VTooltip>
                      </VBtn>
                      <VBtn
                        icon
                        size="small"
                        variant="text"
                        @click.stop="replaceKeywords"
                      >
                        <VIcon icon="mdi-file-replace-outline" />
                        <VTooltip
                          activator="parent"
                          location="bottom"
                        >
                          {{ t('coreDam.asset.massOperations.replaceOne') }}
                        </VTooltip>
                      </VBtn>
                    </div>
                  </ASystemEntityScope>
                </VCol>
              </VRow>
              <VRow
                dense
                class="my-2"
              >
                <VCol>
                  <ASystemEntityScope
                    subject="author"
                    system="dam"
                  >
                    <div class="d-flex">
                      <div style="min-width: 286px">
                        <AuthorRemoteAutocompleteWithCached
                          v-model="massOperationsAuthors"
                          :label="t('coreDam.asset.model.authors')"
                          clearable
                          multiple
                          :validation-scope="false"
                        />
                      </div>
                      <VBtn
                        icon
                        size="small"
                        variant="text"
                        class="mr-1"
                        @click.stop="fillEmptyAuthors"
                      >
                        <VIcon icon="mdi-file-arrow-left-right-outline" />
                        <VTooltip
                          activator="parent"
                          location="bottom"
                        >
                          {{ t('coreDam.asset.massOperations.fillOneEmpty') }}
                        </VTooltip>
                      </VBtn>
                      <VBtn
                        icon
                        size="small"
                        variant="text"
                        @click.stop="replaceAuthors"
                      >
                        <VIcon icon="mdi-file-replace-outline" />
                        <VTooltip
                          activator="parent"
                          location="bottom"
                        >
                          {{ t('coreDam.asset.massOperations.replaceOne') }}
                        </VTooltip>
                      </VBtn>
                    </div>
                  </ASystemEntityScope>
                </VCol>
              </VRow>
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel
            v-if="assetTypes.includes(DamAssetType.Image)"
            elevation="0"
            :title="t('coreDam.asset.assetType.image')"
            :value="DamAssetType.Image"
          >
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations
                v-model="massOperationsData.image"
                :asset-type="DamAssetType.Image"
                @fill-empty-field="fillEmptyField"
                @replace-field="replaceField"
              />
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel
            v-if="assetTypes.includes(DamAssetType.Video)"
            elevation="0"
            :title="t('coreDam.asset.assetType.video')"
            :value="DamAssetType.Video"
          >
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations
                v-model="massOperationsData.video"
                :asset-type="DamAssetType.Video"
                @fill-empty-field="fillEmptyField"
                @replace-field="replaceField"
              />
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel
            v-if="assetTypes.includes(DamAssetType.Audio)"
            elevation="0"
            :title="t('coreDam.asset.assetType.audio')"
            :value="DamAssetType.Audio"
          >
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations
                v-model="massOperationsData.audio"
                :asset-type="DamAssetType.Audio"
                @fill-empty-field="fillEmptyField"
                @replace-field="replaceField"
              />
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel
            v-if="assetTypes.includes(DamAssetType.Document)"
            elevation="0"
            :title="t('coreDam.asset.assetType.document')"
            :value="DamAssetType.Document"
          >
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations
                v-model="massOperationsData.document"
                :asset-type="DamAssetType.Document"
                @fill-empty-field="fillEmptyField"
                @replace-field="replaceField"
              />
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </div>
      <div class="sidebar-info__actions pa-2 d-flex align-center justify-center">
        <VBtn
          class="mr-2"
          variant="text"
          size="small"
          @click.stop="fillAll(false)"
        >
          {{ t('coreDam.asset.massOperations.fillAllEmpty') }}
        </VBtn>
        <VBtn
          class="mr-2"
          variant="text"
          size="small"
          @click.stop="fillAll(true)"
        >
          {{ t('coreDam.asset.massOperations.replaceAll') }}
        </VBtn>
        <VBtn
          variant="text"
          size="small"
          @click.stop="clearForm"
        >
          {{ t('coreDam.asset.massOperations.clearForm') }}
        </VBtn>
      </div>
    </div>
  </div>
</template>
