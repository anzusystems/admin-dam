<script lang="ts" setup>
import { useAuth } from '@/domains/system/auth/auth'
import { useCurrentListView } from '@/domains/coreDam/assetListView/composables/currentListView'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import { fetchAssetLicence } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { useFetchExtSystem } from '@/domains/coreDam/extSystem/api/extSystemApi'
import { updateCurrentUser } from '@/domains/coreDam/user/api/userApi'
import AssetToolbarExtSystemLicenceDialog from '@/domains/coreDam/asset/components/toolbar/AssetToolbarExtSystemLicenceDialog.vue'
import { SYSTEM_DAM } from '@/shared/systems'
import type { DamCurrentUserWithListViewsDto } from '@/domains/coreDam/assetListView/types/AssetListView'
import type { DamAssetLicence, DamExtSystem } from '@anzusystems/common-admin'

const { t } = useI18n()

const router = useRouter()

const { useCurrentUser } = useAuth()
const { currentUser } = useCurrentUser<DamCurrentUserWithListViewsDto>(SYSTEM_DAM)

const { availableListViews, currentListView } = useCurrentListView()
const { currentExtSystemId } = useCurrentExtSystem()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { addToCachedAssetLicences, fetchCachedAssetLicences, getCachedAssetLicence } = useCachedAssetLicences()

const { showErrorsDefault } = useAlerts()

const { executeRequest: fetchExtSystem } = useFetchExtSystem()

const currentExtSystem = ref<DamExtSystem | undefined>(undefined)
const currentAssetLicence = ref<DamAssetLicence | undefined>(undefined)

const availableLicences = computed(
  () => currentUser.value?.assetLicencesDto.filter((licence) => licence.extSystem === currentExtSystemId.value) ?? []
)

const activeDisplayText = computed(
  () => currentListView.value?.name || getCachedAssetLicence(currentAssetLicenceId.value)?.name || ''
)

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

const onSelectView = async (id: IntegerId) => {
  if (saving.value || !currentUser.value || id === currentListView.value?.id) return
  saving.value = true
  try {
    await updateCurrentUser({ selectedListView: id, selectedLicence: currentUser.value.selectedLicence })
    window.location.assign(router.resolve({ name: '/(coreDam)/assets' }).href)
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saving.value = false
  }
}

const onSelectLicence = async (id: IntegerId) => {
  if (saving.value || !currentUser.value || (!currentListView.value && id === currentAssetLicenceId.value)) return
  saving.value = true
  try {
    await updateCurrentUser({ selectedLicence: id, selectedListView: null })
    window.location.assign(router.resolve({ name: '/(coreDam)/assets' }).href)
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!currentListView.value) {
    addToCachedAssetLicences(currentAssetLicenceId.value)
    fetchCachedAssetLicences()
  }
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
        :prepend-icon="currentListView ? 'mdi-view-list' : 'mdi-key'"
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
          :active="listView.id === currentListView?.id"
          :title="listView.name"
          @click.stop="onSelectView(listView.id)"
        />
        <VDivider />
      </template>
      <VListSubheader>{{ t('system.mainBar.listViewSwitch.licences') }}</VListSubheader>
      <VListItem
        v-for="licence in availableLicences"
        :key="licence.id"
        :active="!currentListView && licence.id === currentAssetLicenceId"
        :title="licence.name"
        @click.stop="onSelectLicence(licence.id)"
      />
      <VListItem
        :title="t('system.mainBar.listViewSwitch.changeLicence')"
        prepend-icon="mdi-key-arrow-right"
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
</template>
