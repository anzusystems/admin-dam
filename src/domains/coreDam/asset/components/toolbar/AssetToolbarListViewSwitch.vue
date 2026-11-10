<script lang="ts" setup>
import { useAuth } from '@/domains/system/auth/auth'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { fetchAssetLicence } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { useFetchExtSystem } from '@/domains/coreDam/extSystem/api/extSystemApi'
import { updateCurrentUser } from '@/domains/coreDam/user/api/userApi'
import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT, QUEUE_ID_UPLOAD_GLOBAL } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'
import AssetToolbarExtSystemLicenceDialog from '@/domains/coreDam/asset/components/toolbar/AssetToolbarExtSystemLicenceDialog.vue'
import { SYSTEM_DAM } from '@/shared/systems'
import type { DamCurrentUserWithListViewsDto } from '@/domains/coreDam/assetListView/types/AssetListView'
import { ADialogToolbar, type DamAssetLicence, type DamExtSystem } from '@anzusystems/common-admin'

const { t } = useI18n()

const router = useRouter()

const { useCurrentUser } = useAuth()
const { currentUser } = useCurrentUser<DamCurrentUserWithListViewsDto>(SYSTEM_DAM)

const { currentExtSystemId, currentListViewId } = useCurrentExtSystem()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const uploadQueuesStore = useUploadQueuesStore()
const { addToCachedAssetLicences, fetchCachedAssetLicences, getCachedAssetLicence } = useCachedAssetLicences()

const { showErrorsDefault } = useAlerts()

const { executeRequest: fetchExtSystem } = useFetchExtSystem()

const currentExtSystem = ref<DamExtSystem | undefined>(undefined)
const currentAssetLicence = ref<DamAssetLicence | undefined>(undefined)

const availableLicences = computed(
  () =>
    currentUser.value?.resolvedAssetLicences.filter((licence) => licence.extSystem === currentExtSystemId.value) ?? []
)

const availableListViews = computed(
  () => currentUser.value?.listViews.filter((view) => view.extSystem === currentExtSystemId.value) ?? []
)

const currentListView = computed(() => currentUser.value?.listViews.find((view) => view.id === currentListViewId.value))

const activeDisplayText = computed(() => currentListView.value?.name || currentAssetLicence.value?.name || '')

const uploadLicenceText = (uploadLicence: IntegerIdNullable) => {
  if (isNull(uploadLicence)) return t('system.mainBar.listViewSwitch.readOnly')
  return t('system.mainBar.listViewSwitch.uploadsTo', {
    licence: getCachedAssetLicence(uploadLicence)?.name || uploadLicence,
  })
}

const displayTextExtSystem = computed(() => {
  if (currentExtSystem.value && currentExtSystem.value.name.length > 0) {
    return currentExtSystem.value.name
  }
  return currentExtSystemId.value + ''
})

const displayTextLicence = computed(() => {
  if (currentAssetLicence.value && currentAssetLicence.value.name.length > 0) {
    return currentAssetLicence.value.name
  }
  return currentAssetLicenceId.value + ''
})

const saving = ref(false)
const dialog = ref(false)
const pendingSelection = ref<{ selectedListView: IntegerIdNullable; selectedLicence: IntegerIdNullable } | null>(null)

const switchTo = async (selection: { selectedListView: IntegerIdNullable; selectedLicence: IntegerIdNullable }) => {
  if (saving.value) return
  saving.value = true
  try {
    await updateCurrentUser(selection)
    window.location.assign(router.resolve({ name: '/(coreDam)/assets' }).href)
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saving.value = false
  }
}

const requestSwitch = (selection: { selectedListView: IntegerIdNullable; selectedLicence: IntegerIdNullable }) => {
  // Switching reloads the page, which drops uploads and edits that live only in the queues.
  const workInProgress = [QUEUE_ID_UPLOAD_GLOBAL, QUEUE_ID_MASS_EDIT].some(
    (queueId) => uploadQueuesStore.getQueueTotalCount(queueId) > 0
  )
  if (workInProgress) {
    pendingSelection.value = selection
    return
  }
  switchTo(selection)
}

const onSelectView = (id: IntegerId) => {
  if (!currentUser.value || id === currentListViewId.value) return
  requestSwitch({ selectedListView: id, selectedLicence: currentUser.value.selectedLicence })
}

const onSelectLicence = (id: IntegerId) => {
  if (!currentUser.value || (isNull(currentListViewId.value) && id === currentAssetLicenceId.value)) return
  requestSwitch({ selectedLicence: id, selectedListView: null })
}

const onConfirmPending = () => {
  if (!pendingSelection.value) return
  switchTo(pendingSelection.value)
}

onMounted(async () => {
  availableListViews.value.forEach((listView) => {
    if (listView.uploadLicence) addToCachedAssetLicences(listView.uploadLicence)
  })
  fetchCachedAssetLicences()
  if (currentExtSystemId.value > 0) {
    try {
      const [extSystem, assetLicence] = await Promise.all([
        fetchExtSystem({ urlParams: { id: currentExtSystemId.value } }),
        currentAssetLicenceId.value > 0 ? fetchAssetLicence(currentAssetLicenceId.value) : undefined,
      ])
      currentExtSystem.value = extSystem
      currentAssetLicence.value = assetLicence
    } catch (error) {
      showErrorsDefault(error)
    }
  }
})
</script>

<template>
  <VMenu location="bottom">
    <template #activator="{ props }">
      <VBtn
        variant="text"
        size="small"
        class="mx-1 pl-2 pr-1 pl-sm-3 pr-sm-2"
        rounded="pill"
        :height="34"
        :prepend-icon="isNull(currentListViewId) ? 'mdi-key' : undefined"
        v-bind="props"
      >
        {{ activeDisplayText }}
        <VIcon icon="mdi-chevron-down" />
        <VTooltip
          activator="parent"
          location="bottom"
        >
          {{ t('system.mainBar.listViewSwitch.title') }}
        </VTooltip>
      </VBtn>
    </template>
    <VList>
      <template v-if="availableListViews.length > 0">
        <VListSubheader>{{ t('system.mainBar.listViewSwitch.listViews') }}</VListSubheader>
        <VListItem
          v-for="listView in availableListViews"
          :key="listView.id"
          :active="listView.id === currentListViewId"
          :title="listView.name"
          :subtitle="uploadLicenceText(listView.uploadLicence)"
          @click.stop="onSelectView(listView.id)"
        />
        <VDivider />
      </template>
      <VListSubheader>{{ t('system.mainBar.listViewSwitch.licences') }}</VListSubheader>
      <VListItem
        v-for="licence in availableLicences"
        :key="licence.id"
        :active="isNull(currentListViewId) && licence.id === currentAssetLicenceId"
        :title="licence.name"
        @click.stop="onSelectLicence(licence.id)"
      />
      <VListItem
        :title="t('system.mainBar.listViewSwitch.changeLicence')"
        data-cy="button-switch-licence"
        @click.stop="dialog = true"
      />
    </VList>
  </VMenu>
  <AssetToolbarExtSystemLicenceDialog
    v-if="dialog"
    v-model="dialog"
    :ext-system-name="displayTextExtSystem"
    :licence-name="displayTextLicence"
  />
  <VDialog
    :model-value="!!pendingSelection"
    :width="500"
    @update:model-value="pendingSelection = null"
  >
    <VCard v-if="pendingSelection">
      <ADialogToolbar @on-cancel="pendingSelection = null">
        {{ t('system.mainBar.listViewSwitch.title') }}
      </ADialogToolbar>
      <VCardText>
        {{ t('system.mainBar.extSystemLicenceSwitch.description') }}
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary @click.stop="pendingSelection = null">
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="saving"
          data-cy="button-confirm-list-view-switch"
          @click.stop="onConfirmPending"
        >
          {{ t('system.mainBar.extSystemLicenceSwitch.confirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
