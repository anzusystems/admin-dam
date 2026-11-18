<script lang="ts" setup>
import { ACreateDialog, ASystemEntityScope } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { ENTITY, useCreateAssetListView } from '@/domains/coreDam/assetListView/api/assetListViewApi'
import AssetListViewFormFields from '@/domains/coreDam/assetListView/components/AssetListViewFormFields.vue'
import { useAssetListViewFactory } from '@/domains/coreDam/assetListView/factory/AssetListViewFactory'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

withDefaults(
  defineProps<{
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonClass: 'ml-2',
    dataCy: '',
  }
)
const emit = defineEmits<{ onSuccess: [data: AssetListView] }>()

const { createDefault } = useAssetListViewFactory()
const assetListView = ref<AssetListView>(createDefault())
const dialog = ref(false)

const v$ = useVuelidate()
const { t } = useI18n()

const onOpen = () => {
  assetListView.value = createDefault()
}

const { execute: createAssetListView } = useCreateAssetListView()

const create = async () => await createAssetListView({ body: assetListView.value })
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
    @open="onOpen"
    @success="emit('onSuccess', $event)"
    @close="dialog = false"
  >
    <template #title>
      {{ t('coreDam.assetListView.meta.create') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <AssetListViewFormFields v-model="assetListView" />
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
