<script setup lang="ts">
import { ref } from 'vue'
import {
  useExternalProviderAssetDetailActions
} from '@/views/coreDam/externalProviderAsset/composables/externalProviderAssetDetailActions'
import { useI18n } from 'vue-i18n'
import ExternalProviderAssetMetadataItem
  from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetMetadataItem.vue'
import ExternalProviderAssetDetailSidebarActionsWrapper
  from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetDetailSidebarActionsWrapper.vue'
import {
  useExternalProviderAssetImport
} from '@/views/coreDam/externalProviderAsset/composables/externalProviderAssetImport'

const props = withDefaults(
  defineProps<{
    detailDialog?: boolean
  }>(),
  {
    detailDialog: false,
  }
)

const { t } = useI18n()

const panels = ref(['info', 'meta'])

const { asset } = useExternalProviderAssetDetailActions()

const { importFromDetail } = useExternalProviderAssetImport()

const onImport = () => {
  importFromDetail(props.detailDialog)
}
</script>

<template>
  <ExternalProviderAssetDetailSidebarActionsWrapper v-if="detailDialog && asset">
    <VBtn color="secondary" type="submit" variant="flat" class="ml-2" @click.stop="onImport"> Import to DAM </VBtn>
  </ExternalProviderAssetDetailSidebarActionsWrapper>
  <VExpansionPanels v-if="asset" v-model="panels" multiple class="v-expansion-panels--compact">
    <VExpansionPanel elevation="0" title="Metadata" value="meta">
      <VExpansionPanelText class="text-caption">
        <VRow v-for="(value, key) in asset.metadata" :key="key">
          <VCol cols="4" class="word-break-all">{{ key }}</VCol>
          <VCol><ExternalProviderAssetMetadataItem :value="value" /></VCol>
        </VRow>
      </VExpansionPanelText>
    </VExpansionPanel>
    <VExpansionPanel elevation="0" title="File info" value="info">
      <VExpansionPanelText class="text-caption">
        <VRow>
          <VCol cols="4" class="word-break-all">Id</VCol>
          <VCol>{{ asset.id }}</VCol>
        </VRow>
        <VRow>
          <VCol cols="4" class="word-break-all">{{ t('coreDam.asset.detail.info.field.type') }}</VCol>
          <VCol>{{ asset.attributes.assetType }}</VCol>
        </VRow>
        <VRow>
          <VCol cols="4" class="word-break-all">Title</VCol>
          <VCol>{{ asset.texts.displayTitle }}</VCol>
        </VRow>
      </VExpansionPanelText>
    </VExpansionPanel>
  </VExpansionPanels>
</template>
