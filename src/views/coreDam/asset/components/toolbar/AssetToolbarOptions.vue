<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import AssetCreateButton from '@/views/coreDam/asset/components/AssetCreateButton.vue'
import { computed, onMounted, ref } from 'vue'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import AssetToolbarExtSystemLicenceDialog from '@/views/coreDam/asset/components/toolbar/AssetToolbarExtSystemLicenceDialog.vue'
import { ACL } from '@/composables/auth/auth'
import { type DamAssetLicence, type DamExtSystem, useAlerts } from '@anzusystems/common-admin'
import { fetchAssetLicence } from '@/services/api/coreDam/assetLicenceApi'
import { fetchExtSystem } from '@/services/api/coreDam/extSystemApi'

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
const { currentAssetLicenceId } = useCurrentAssetLicence()

const currentExtSystem = ref<DamExtSystem | undefined>(undefined)
const currentAssetLicence = ref<DamAssetLicence | undefined>(undefined)

const displayTextExtSystem = computed(() => {
  if (currentExtSystem.value && currentExtSystem.value.name.length > 0) {
    return currentExtSystem.value.name
  }
  return currentExtSystemId.value
})

const displayTextLicence = computed(() => {
  if (currentAssetLicence.value && currentAssetLicence.value.name.length > 0) {
    return currentAssetLicence.value.name
  }
  return currentAssetLicenceId.value
})

const dialog = ref(false)

const openDialog = () => {
  dialog.value = true
}

const { showErrorsDefault } = useAlerts()

onMounted(async () => {
  if (currentAssetLicenceId.value > 0 && currentExtSystemId.value > 0) {
    try {
      const [assetLicence, extSystem] = await Promise.all([
        fetchAssetLicence(currentAssetLicenceId.value),
        fetchExtSystem(currentExtSystemId.value),
      ])
      currentAssetLicence.value = assetLicence
      currentExtSystem.value = extSystem
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
            <AssetCreateButton />
          </Acl>
          <VDivider />
          <Acl :permission="ACL.DAM_PODCAST_UI">
            <VListItem
              :to="{ name: ROUTE.DAM.PODCAST.LIST }"
              :title="t('system.mainBar.podcasts')"
              prepend-icon="mdi-podcast"
              data-cy="button-main-podcast"
            />
          </Acl>
          <Acl :permission="ACL.DAM_VIDEO_SHOW_UI">
            <VListItem
              :to="{ name: ROUTE.DAM.VIDEO_SHOW.LIST }"
              :title="t('system.mainBar.videoShows')"
              prepend-icon="mdi-video"
              data-cy="button-main-video-show"
            />
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
            :to="{ name: ROUTE.SYSTEM.SETTINGS }"
            :title="t('system.currentUser.settings')"
            prepend-icon="mdi-cog"
            data-cy="button-settings"
          />
          <VListItem
            v-show="variant === 'settings'"
            prepend-icon="mdi-home"
            :to="{ name: ROUTE.DAM.ASSET.LIST }"
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
