<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { useI18n } from 'vue-i18n'
import AssetCustomMetadataFormMassOperations from '@/components/dam/customMetadata/AssetCustomMetadataFormMassOperations.vue'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import KeywordSelect from '@/views/dam/keyword/components/KeywordSelect.vue'
import AuthorSelect from '@/views/dam/author/components/AuthorSelect.vue'

const props = withDefaults(
  defineProps<{
    queueId: string
  }>(),
  {}
)

const massOperationsData = ref({ image: {}, video: {}, audio: {}, document: {} })
const massOperationsKeywords = ref([])
const massOperationsAuthors = ref([])

const { t } = useI18n({ useScope: 'global' })

const panels = ref<Array<string>>(['general'])

const uploadQueuesStore = useUploadQueuesStore()

const fillEmptyField = (data: { assetType: AssetType; elementKey: string; value: any }) => {
  uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(props.queueId, data)
}
const replaceField = (data: { assetType: AssetType; elementKey: string; value: any }) => {
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
  for (const [elementKey, value] of Object.entries(massOperationsData.value.image)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: AssetType.Image,
        elementKey,
        value,
      },
      forceReplace
    )
  }
  for (const [elementKey, value] of Object.entries(massOperationsData.value.video)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: AssetType.Video,
        elementKey,
        value,
      },
      forceReplace
    )
  }
  for (const [elementKey, value] of Object.entries(massOperationsData.value.audio)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: AssetType.Audio,
        elementKey,
        value,
      },
      forceReplace
    )
  }
  for (const [elementKey, value] of Object.entries(massOperationsData.value.document)) {
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(
      props.queueId,
      {
        assetType: AssetType.Document,
        elementKey,
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
        <div class="text-caption pa-3">{{ t('coreDam.asset.massOperations.description') }}</div>
        <VExpansionPanels v-model="panels" multiple class="v-expansion-panels--compact">
          <VExpansionPanel elevation="0" :title="t('coreDam.asset.massOperations.general')" value="general">
            <VExpansionPanelText>
              <VRow dense class="my-2">
                <VCol>
                  <ASystemEntityScope subject="keyword" system="dam">
                    <div class="d-flex">
                      <div style="min-width: 292px">
                        <KeywordSelect
                          v-model="massOperationsKeywords"
                          label="Keywords"
                          chips
                          clearable
                          multiple
                          :validation-scope="false"
                          disable-init-fetch
                        />
                      </div>
                      <VBtn icon size="small" variant="text" class="mr-1" @click.stop="fillEmptyKeywords">
                        <VIcon icon="mdi-file-arrow-left-right-outline" />
                        <VTooltip activator="parent" location="bottom">
                          {{ t('coreDam.asset.massOperations.fillOneEmpty') }}
                        </VTooltip>
                      </VBtn>
                      <VBtn icon size="small" variant="text" @click.stop="replaceKeywords">
                        <VIcon icon="mdi-file-replace-outline" />
                        <VTooltip activator="parent" location="bottom">
                          {{ t('coreDam.asset.massOperations.replaceOne') }}
                        </VTooltip>
                      </VBtn>
                    </div>
                  </ASystemEntityScope>
                </VCol>
              </VRow>
              <VRow dense class="my-2">
                <VCol>
                  <ASystemEntityScope subject="author" system="dam">
                    <div class="d-flex">
                      <div style="min-width: 292px">
                        <AuthorSelect
                          v-model="massOperationsAuthors"
                          label="Authors"
                          chips
                          clearable
                          multiple
                          disable-init-fetch
                          :validation-scope="false"
                        />
                      </div>
                      <VBtn icon size="small" variant="text" class="mr-1" @click.stop="fillEmptyAuthors">
                        <VIcon icon="mdi-file-arrow-left-right-outline" />
                        <VTooltip activator="parent" location="bottom">
                          {{ t('coreDam.asset.massOperations.fillOneEmpty') }}
                        </VTooltip>
                      </VBtn>
                      <VBtn icon size="small" variant="text" @click.stop="replaceAuthors">
                        <VIcon icon="mdi-file-replace-outline" />
                        <VTooltip activator="parent" location="bottom">
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
            v-if="assetTypes.includes(AssetType.Image)"
            elevation="0"
            :title="t('coreDam.asset.assetType.image')"
            :value="AssetType.Image"
          >
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations
                v-model="massOperationsData.image"
                :asset-type="AssetType.Image"
                @fill-empty-field="fillEmptyField"
                @replace-field="replaceField"
              />
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel
            v-if="assetTypes.includes(AssetType.Video)"
            elevation="0"
            :title="t('coreDam.asset.assetType.video')"
            :value="AssetType.Video"
          >
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations v-model="massOperationsData.video" :asset-type="AssetType.Video" />
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel
            v-if="assetTypes.includes(AssetType.Audio)"
            elevation="0"
            :title="t('coreDam.asset.assetType.audio')"
            :value="AssetType.Audio"
          >
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations v-model="massOperationsData.audio" :asset-type="AssetType.Audio" />
            </VExpansionPanelText>
          </VExpansionPanel>
          <VExpansionPanel
            v-if="assetTypes.includes(AssetType.Document)"
            elevation="0"
            :title="t('coreDam.asset.assetType.document')"
            :value="AssetType.Document"
          >
            <VExpansionPanelText>
              <AssetCustomMetadataFormMassOperations
                v-model="massOperationsData.document"
                :asset-type="AssetType.Document"
              />
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </div>
      <div class="sidebar-info__actions pa-2 d-flex align-center justify-center">
        <VBtn class="mr-2" variant="flat" color="secondary" size="small" @click.stop="fillAll(false)">
          {{ t('coreDam.asset.massOperations.fillAllEmpty') }}
        </VBtn>
        <VBtn class="mr-2" variant="flat" color="secondary" size="small" @click.stop="fillAll(true)">
          {{ t('coreDam.asset.massOperations.replaceAll') }}
        </VBtn>
        <VBtn variant="flat" color="secondary" size="small" @click.stop="clearForm">
          {{ t('coreDam.asset.massOperations.clearForm') }}
        </VBtn>
      </div>
    </div>
  </div>
</template>
