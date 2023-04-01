<script lang="ts" setup>
import AssetToolbarOptions from '@/views/coreDam/asset/components/toolbar/AssetToolbarOptions.vue'
import CurrentUserDropdown from '@/components/system/CurrentUserDropdown.vue'
import AssetUpload from '@/views/coreDam/asset/components/AssetUpload.vue'
import AssetFooterUploadOverlay from '@/views/coreDam/asset/components/footer/AssetFooterUploadOverlay.vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import { useI18n } from 'vue-i18n'
import AssetToolbarExtSystemLicence from '@/views/coreDam/asset/components/toolbar/AssetToolbarExtSystemLicence.vue'
import AssetFooterUploadSlotsOverlay from '@/views/coreDam/asset/components/footer/AssetFooterUploadSlotsOverlay.vue'
import logoFull from '@/assets/logo-adam-full.svg'
import logoNoText from '@/assets/logo-adam-no-text.svg'
import { ROUTE } from '@/router/routes'
import AssetToolbarIntegrations from '@/views/coreDam/asset/components/toolbar/AssetToolbarIntegrations.vue'
import { ACL } from '@/types/Permission'
import { ASystemBar } from '@anzusystems/common-admin'
import { envConfig } from '@/services/EnvConfigService'

const { t } = useI18n()

const { sidebarLeft, sidebarRight, customFooterHeight, customDialog } = useMainWrapper()
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
      class="system-border-b"
    >
      <div class="d-flex w-100 justify-space-between align-center overflow-x-auto pb-2 pt-1 py-sm-2 pr-1">
        <div class="d-flex align-center">
          <div class="main-logo mr-sm-2 pl-1">
            <RouterLink :to="{ name: ROUTE.DAM.ASSET.LIST }">
              <img
                width="104"
                height="42"
                :src="logoFull"
                alt="ADAM"
                class="hidden-xs"
              >
              <img
                width="42"
                height="42"
                :src="logoNoText"
                alt="ADAM"
                class="hidden-sm-and-up"
              >
            </RouterLink>
          </div>
          <Acl :permission="ACL.DAM_ASSET_EXTERNAL_PROVIDER_ACCESS">
            <AssetToolbarIntegrations />
          </Acl>
          <slot name="main-bar-left" />
        </div>
        <div class="d-flex align-center">
          <slot name="main-bar-right" />
          <AssetToolbarExtSystemLicence />
          <AssetToolbarOptions variant="main" />
          <CurrentUserDropdown />
        </div>
      </div>
    </VAppBar>
    <VAppBar
      :order="-1"
      :height="39"
      elevation="0"
      class="system-border-b"
    >
      <slot name="second-bar">
        <div class="d-flex flex-column w-100 px-1 align-center">
          <div class="d-flex justify-space-between w-100 align-center">
            <div class="d-flex align-center">
              <VBtn
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
      persistent
      no-click-animation
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
