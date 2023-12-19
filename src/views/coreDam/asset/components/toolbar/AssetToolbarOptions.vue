<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import AssetCreateButton from '@/views/coreDam/asset/components/AssetCreateButton.vue'
import { computed, ref } from 'vue'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import AssetToolbarExtSystemLicenceDialog from '@/views/coreDam/asset/components/toolbar/AssetToolbarExtSystemLicenceDialog.vue'

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

const { currentExtSystem } = useCurrentExtSystem()
const { currentAssetLicence } = useCurrentAssetLicence()

const displayTextExtSystem = computed(() => {
  if (currentExtSystem.value) {
    return currentExtSystem.value.name
  }
  return ''
})

const displayTextLicence = computed(() => {
  if (currentAssetLicence.value) {
    return currentAssetLicence.value.name
  }
  return ''
})

const dialog = ref(false)

const openDialog = () => {
  dialog.value = true
}
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
            :title="t('system.mainBar.extSystemLicenceSwitch.changeLicence', { currentLicence: displayTextExtSystem })"
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
