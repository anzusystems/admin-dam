<script lang="ts" setup>
import { useDamConfigState } from '@anzusystems/common-admin'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useCurrentListView } from '@/domains/coreDam/assetListView/composables/currentListView'
import { fetchAssetLicence } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { useFetchExtSystem } from '@/domains/coreDam/extSystem/api/extSystemApi'
import { updateCurrentUser } from '@/domains/coreDam/user/api/userApi'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_DAM } from '@/shared/systems'
import AssetToolbarExtSystemLicenceDialog from '@/domains/coreDam/asset/components/toolbar/AssetToolbarExtSystemLicenceDialog.vue'
import type { DamCurrentUserWithListViewsDto } from '@/domains/coreDam/assetListView/types/AssetListView'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const { useCurrentUser } = useAuth()
const { currentUser } = useCurrentUser<DamCurrentUserWithListViewsDto>(SYSTEM_DAM)

const { currentExtSystemId } = useCurrentExtSystem()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { availableListViews, currentListView } = useCurrentListView()

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const externalProviders = computed(() => {
  return configExtSystem.assetExternalProviders ?? {}
})

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

const activeProviderDisplayText = computed(() => {
  const providerParam = (route.params as { provider?: string }).provider as undefined | string
  const matchedProvider = providerParam ? externalProviders.value[providerParam] : undefined
  if (route.name === '/(coreDam)/external-providers/[provider]' && matchedProvider) {
    return matchedProvider.title
  }
  return undefined
})

const activeDisplayText = computed(() => {
  return activeProviderDisplayText.value ?? currentListView.value?.name ?? displayTextLicence.value
})

const goToExternalProvider = (provider: string) => {
  router.push({ name: '/(coreDam)/external-providers/[provider]', params: { provider } })
}

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
          {{ t('system.mainBar.customIntegrations.title') }}
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
      <Acl :permission="ACL.DAM_ASSET_EXTERNAL_PROVIDER_ACCESS">
        <template v-if="!isEmptyObject(externalProviders)">
          <VDivider />
          <VListItem
            v-for="(value, key) in externalProviders"
            :key="key"
            :title="value.title"
            @click.stop="goToExternalProvider(key)"
          />
        </template>
      </Acl>
    </VList>
  </VMenu>
  <AssetToolbarExtSystemLicenceDialog
    v-if="licenceDialog"
    v-model="licenceDialog"
    :ext-system-name="displayTextExtSystem"
    :licence-name="displayTextLicence"
  />
</template>
