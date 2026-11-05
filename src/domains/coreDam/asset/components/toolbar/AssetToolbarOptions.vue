<script lang="ts" setup>
import AssetCreateButton from '@/domains/coreDam/asset/components/AssetCreateButton.vue'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import AssetToolbarExtSystemLicenceDialog from '@/domains/coreDam/asset/components/toolbar/AssetToolbarExtSystemLicenceDialog.vue'
import { ACL } from '@/domains/system/auth/auth'
import { type DamAssetLicence, type DamExtSystem, useDamConfigState } from '@anzusystems/common-admin'
import { fetchAssetLicence } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { damClient } from '@/shared/apiClients/damClient'
import { useFetchExtSystem } from '@/domains/coreDam/extSystem/api/extSystemApi'

withDefaults(
  defineProps<{
    variant?: 'main' | 'settings'
    dataCy?: string
  }>(),
  {
    variant: 'main',
    dataCy: undefined,
  }
)

const { t } = useI18n()

const { currentExtSystemId } = useCurrentExtSystem()
const { currentAssetLicenceId, uploadAllowed } = useCurrentAssetLicence()

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const externalProviders = computed(() => configExtSystem.assetExternalProviders ?? {})

const currentExtSystem = ref<DamExtSystem | undefined>(undefined)
const currentAssetLicence = ref<DamAssetLicence | undefined>(undefined)

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

const dialog = ref(false)

const openDialog = () => {
  dialog.value = true
}

const { showErrorsDefault } = useAlerts()

const { executeRequest: fetchExtSystem } = useFetchExtSystem()

onMounted(async () => {
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
  <VBtn
    variant="text"
    icon
    size="small"
    class="mx-1"
    data-cy="button-main"
  >
    <VIcon icon="mdi-view-grid-plus-outline" />
    <VMenu activator="parent">
      <VCard min-width="300">
        <VList>
          <Acl :permission="ACL.DAM_ASSET_CREATE">
            <AssetCreateButton v-if="uploadAllowed" />
          </Acl>
          <VDivider />
          <Acl :permission="ACL.DAM_PODCAST_UI">
            <VListItem
              :to="{ name: '/(coreDam)/podcasts' }"
              :title="t('system.mainBar.podcasts')"
              prepend-icon="mdi-podcast"
              data-cy="button-main-podcast"
            />
          </Acl>
          <Acl :permission="ACL.DAM_VIDEO_SHOW_UI">
            <VListItem
              :to="{ name: '/(coreDam)/video-shows' }"
              :title="t('system.mainBar.videoShows')"
              prepend-icon="mdi-video"
              data-cy="button-main-video-show"
            />
          </Acl>
          <Acl :permission="ACL.DAM_ASSET_EXTERNAL_PROVIDER_ACCESS">
            <template v-if="!isEmptyObject(externalProviders)">
              <VDivider />
              <VListItem
                v-for="(provider, key) in externalProviders"
                :key="key"
                :to="{ name: '/(coreDam)/external-providers/[provider]', params: { provider: key } }"
                :title="provider.title"
                prepend-icon="mdi-puzzle-outline"
              />
            </template>
          </Acl>
          <VDivider />
          <VListItem
            v-show="variant === 'main'"
            :title="t('system.mainBar.extSystemLicenceSwitch.changeLicence')"
            :subtitle="displayTextExtSystem + '/' + displayTextLicence"
            data-cy="button-switch-licence"
            prepend-icon="mdi-key-arrow-right"
            @click.stop="openDialog"
          />
          <VDivider />
          <VListItem
            v-show="variant === 'main'"
            to="/settings"
            :title="t('system.currentUser.settings')"
            prepend-icon="mdi-cog"
            data-cy="button-settings"
          />
          <VListItem
            v-show="variant === 'settings'"
            prepend-icon="mdi-home"
            :to="{ name: '/(coreDam)/assets' }"
            :title="t('system.currentUser.backToAssets')"
          />
        </VList>
      </VCard>
    </VMenu>
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('system.mainBar.options') }}
    </VTooltip>
  </VBtn>
  <AssetToolbarExtSystemLicenceDialog
    v-if="dialog"
    v-model="dialog"
    :ext-system-name="displayTextExtSystem"
    :licence-name="displayTextLicence"
  />
</template>
