<script lang="ts" setup>
import { useAuth } from '@/domains/system/auth/auth'
import { useCurrentListView } from '@/domains/coreDam/assetListView/composables/currentListView'
import { useCurrentAssetLicence } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import { updateCurrentUser } from '@/domains/coreDam/user/api/userApi'
import { SYSTEM_DAM } from '@/shared/systems'
import type { DamCurrentUserWithListViewsDto } from '@/domains/coreDam/assetListView/types/AssetListView'

const { t } = useI18n()

const router = useRouter()

const { useCurrentUser } = useAuth()
const { currentUser } = useCurrentUser<DamCurrentUserWithListViewsDto>(SYSTEM_DAM)

const { availableListViews, currentListView } = useCurrentListView()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { addToCachedAssetLicences, fetchCachedAssetLicences, getCachedAssetLicence } = useCachedAssetLicences()

const { showErrorsDefault } = useAlerts()

const activeDisplayText = computed(
  () => currentListView.value?.name || getCachedAssetLicence(currentAssetLicenceId.value)?.name || ''
)

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

onMounted(() => {
  if (currentListView.value) return
  addToCachedAssetLicences(currentAssetLicenceId.value)
  fetchCachedAssetLicences()
})
</script>

<template>
  <VMenu
    v-if="availableListViews.length > 0"
    location="bottom"
  >
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
    </VList>
  </VMenu>
</template>
