<script lang="ts" setup>
import { AAdminSwitcher, ASystemBar } from '@anzusystems/common-admin'
import { onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

import logoFull from '@/assets/logo-adam-full.svg'
import logoNoText from '@/assets/logo-adam-no-text.svg'
import AssetUpload from '@/domains/coreDam/asset/components/AssetUpload.vue'
import AssetFooterUploadOverlay from '@/domains/coreDam/asset/components/footer/AssetFooterUploadOverlay.vue'
import AssetFooterUploadSlotsOverlay from '@/domains/coreDam/asset/components/footer/AssetFooterUploadSlotsOverlay.vue'
import AssetToolbarIntegrations from '@/domains/coreDam/asset/components/toolbar/AssetToolbarIntegrations.vue'
import AssetToolbarOptions from '@/domains/coreDam/asset/components/toolbar/AssetToolbarOptions.vue'
import { FooterViewSelected, useAssetFooterSelectedView } from '@/domains/coreDam/asset/composables/assetFooterSelected'
import {
  ExternalProviderFooterViewSelected,
  useExternalProviderAssetFooterSelectedView,
} from '@/domains/coreDam/asset/composables/externalProviderAssetFooterSelected'
import { ACL } from '@/domains/system/auth/auth'
import CurrentUserDropdown from '@/domains/system/components/CurrentUserDropdown.vue'
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'
import { envConfig } from '@/shared/EnvConfigService'

const { t } = useI18n()

const { sidebarLeft, sidebarRight, customFooterHeight, customDialog } = useMainWrapper()

const { footerViewSelected, hideSelected } = useAssetFooterSelectedView()
const { externalProviderFooterViewSelected, hideSelected: hideExternalProviderSelected } =
  useExternalProviderAssetFooterSelectedView()

/* A selection drawn over the whole page belongs to its page. The back or forward button of the browser leaves the page
 * from under it onto an entry of the history where ADAM was loaded or reloaded: vue-router writes that entry by
 * `replace`, and Vuetify lets a way back or forward to such an entry through an open dialog. The next page drew the
 * dialog over the whole of it then, empty: it draws its own selection only. The selection goes back to its strip,
 * hidden, as the next list empties it anyway. Before the next page is drawn, not once this one is gone. The upload
 * queue is the same on every list, and is drawn over the next one as it was. */
onBeforeUnmount(() => {
  if (footerViewSelected.value === FooterViewSelected.Full) hideSelected()
  if (externalProviderFooterViewSelected.value === ExternalProviderFooterViewSelected.Full) {
    hideExternalProviderSelected()
  }
})
</script>

<template>
  <VLayout>
    <ASystemBar :current-version="envConfig.appVersion" />
    <slot name="sidebar-left" />
    <slot name="sidebar-right" />
    <VAppBar
      density="compact"
      :order="-1"
      elevation="0"
      class="border-b"
    >
      <div class="d-flex w-100 justify-space-between align-center overflow-x-auto pb-2 pt-1 py-sm-2 pr-1">
        <div class="d-flex align-center">
          <div class="main-logo mr-sm-2 pl-1">
            <RouterLink :to="{ name: '/(coreDam)/assets' }">
              <img
                width="104"
                height="42"
                :src="logoFull"
                alt="ADAM"
                class="hidden-xs"
              />
              <img
                width="42"
                height="42"
                :src="logoNoText"
                alt="ADAM"
                class="hidden-sm-and-up"
              />
            </RouterLink>
          </div>
          <slot name="main-bar-left" />
        </div>

        <div class="d-flex align-center">
          <Acl :permission="ACL.DAM_ASSET_EXTERNAL_PROVIDER_ACCESS">
            <AssetToolbarIntegrations />
          </Acl>
          <slot name="main-bar-middle" />
        </div>

        <div class="d-flex align-center">
          <slot name="main-bar-right" />
          <AssetToolbarOptions variant="main" />
          <AAdminSwitcher
            :config-url="envConfig.adminSwitcherConfigUrl"
            class="mr-1"
          />
          <CurrentUserDropdown />
        </div>
      </div>
    </VAppBar>
    <VAppBar
      :order="-1"
      :height="39"
      elevation="0"
      class="border-b"
    >
      <slot name="second-bar">
        <div class="d-flex flex-column w-100 px-1 align-center">
          <div class="d-flex justify-space-between w-100 align-center">
            <div class="d-flex align-center">
              <VBtn
                :aria-label="t('coreDam.asset.list.filterToggle')"
                :aria-expanded="sidebarLeft"
                :active="sidebarLeft"
                icon
                :width="30"
                :height="30"
                :color="sidebarLeft ? 'secondary' : undefined"
                :variant="sidebarLeft ? 'flat' : 'text'"
                @click.stop="sidebarLeft = !sidebarLeft"
              >
                <VIcon
                  icon="mdi-tune"
                  :size="16"
                />
                <VTooltip
                  activator="parent"
                  location="bottom"
                >
                  {{ t('coreDam.asset.list.filterToggle') }}
                </VTooltip>
              </VBtn>
              <slot name="second-bar-left" />
            </div>

            <div class="d-flex align-center">
              <slot name="second-bar-right" />
              <VBtn
                :aria-label="t('coreDam.asset.list.infoToggle')"
                :aria-expanded="sidebarRight"
                :active="sidebarRight"
                icon
                :width="30"
                :height="30"
                :variant="sidebarRight ? 'flat' : 'text'"
                :color="sidebarRight ? 'secondary' : undefined"
                @click.stop="sidebarRight = !sidebarRight"
              >
                <VIcon
                  icon="mdi-information-outline"
                  :size="16"
                />
                <VTooltip
                  activator="parent"
                  location="bottom"
                >
                  {{ t('coreDam.asset.list.infoToggle') }}
                </VTooltip>
              </VBtn>
            </div>
          </div>
        </div>
      </slot>
    </VAppBar>
    <VDialog
      v-if="customDialog"
      :model-value="true"
      fullscreen
      class="overlay--sidebar"
    >
      <VCard>
        <slot name="custom-dialog" />
      </VCard>
    </VDialog>
    <VAppBar
      v-else
      location="bottom"
      :height="customFooterHeight"
      elevation="0"
      class="overflow-visible"
    >
      <div class="w-100 h-100 overflow-visible">
        <div
          class="position-relative w-100 overflow-visible"
          style="height: 0"
        >
          <AssetFooterUploadSlotsOverlay />
          <AssetFooterUploadOverlay />
        </div>
        <div class="asset-footer position-relative d-flex flex-column justify-space-between w-100 h-100">
          <slot name="custom-footer" />
        </div>
      </div>
    </VAppBar>
    <VMain style="height: 100vh">
      <VContainer
        class="pa-3 h-100 overflow-y-auto"
        fluid
      >
        <slot />
      </VContainer>
      <AssetUpload />
    </VMain>
  </VLayout>
</template>

<style lang="scss">
.main-logo img {
  height: 38px;
  display: block;
  width: auto;
}
</style>
