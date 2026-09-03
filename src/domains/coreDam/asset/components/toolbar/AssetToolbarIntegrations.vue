<script lang="ts" setup>
import { useAuth } from '@/domains/system/auth/auth'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useCurrentListView } from '@/domains/coreDam/assetListView/composables/currentListView'
import { fetchAssetLicence } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { useFetchExtSystem } from '@/domains/coreDam/extSystem/api/extSystemApi'
import { updateCurrentUser } from '@/domains/coreDam/user/api/userApi'
import { SYSTEM_DAM } from '@/shared/systems'
import AssetToolbarExtSystemLicenceDialog from '@/domains/coreDam/asset/components/toolbar/AssetToolbarExtSystemLicenceDialog.vue'
import type { DamCurrentUserWithListViewsDto } from '@/domains/coreDam/assetListView/types/AssetListView'

const { t } = useI18n()

const router = useRouter()

const { useCurrentUser } = useAuth()
const { currentUser } = useCurrentUser<DamCurrentUserWithListViewsDto>(SYSTEM_DAM)

const { currentExtSystemId } = useCurrentExtSystem()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { availableListViews, currentListView } = useCurrentListView()

const { showErrorsDefault } = useAlerts()

const displayTextExtSystem = ref('')
const displayTextLicence = ref('')

const { executeRequest: fetchExtSystem } = useFetchExtSystem()

onMounted(async () => {
  displayTextExtSystem.value = currentExtSystemId.value + ''
  displayTextLicence.value = currentAssetLicenceId.value + ''
  if (currentAssetLicenceId.value > 0 && currentExtSystemId.value > 0) {
    try {
      const [assetLicence, extSystem] = await Promise.all([
        fetchAssetLicence(currentAssetLicenceId.value),
        fetchExtSystem({ urlParams: { id: currentExtSystemId.value } }),
      ])
      displayTextLicence.value = assetLicence.name
      displayTextExtSystem.value = extSystem.name
    } catch (error) {
      showErrorsDefault(error)
    }
  }
})

const activeDisplayText = computed(() => currentListView.value?.name ?? displayTextLicence.value)

const licenceDialog = ref(false)

const openLicenceDialog = () => {
  licenceDialog.value = true
}

const saving = ref(false)

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
      <VListItem
        v-for="listView in availableListViews"
        :key="listView.id"
        :active="listView.id === currentListView?.id"
        :title="listView.name"
        @click.stop="onSelectView(listView.id)"
      />
      <VDivider v-if="availableListViews.length" />
      <VListItem
        :title="t('system.mainBar.extSystemLicenceSwitch.chooseLicence')"
        data-cy="button-switch-licence"
        @click.stop="openLicenceDialog"
      />
    </VList>
  </VMenu>
  <AssetToolbarExtSystemLicenceDialog
    v-if="licenceDialog"
    v-model="licenceDialog"
    :ext-system-name="displayTextExtSystem"
    :licence-name="displayTextLicence"
  />
</template>
