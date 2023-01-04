<script lang="ts" setup>
import ASystemBar from '@/components/system/ASystemBar.vue'
import AssetToolbarWidgets from '@/views/dam/asset/components/toolbar/AssetToolbarWidgets.vue'
import DCurrentUserDropdown from '@/components/system/DCurrentUserDropdown.vue'
import AssetUpload from '@/views/dam/asset/components/AssetUpload.vue'
import AssetFooterUploadOverlay from '@/views/dam/asset/components/footer/AssetFooterUploadOverlay.vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'

const { sidebarLeft, sidebarRight, customFooterHeight, customDialog } = useMainWrapper()
</script>

<template>
  <VLayout>
    <ASystemBar />
    <slot name="sidebar-left"></slot>
    <slot name="sidebar-right"></slot>
    <VAppBar :order="-1" :height="46" elevation="0" class="system-border-b">
      <div class="d-flex w-100 justify-space-between align-center">
        <div class="d-flex align-center">
          <div class="mx-2 font-weight-bold">ADAM</div>
          <slot name="main-bar-left"></slot>
        </div>
        <div class="d-flex align-center">
          <slot name="main-bar-right"></slot>
          <AssetToolbarWidgets />
          <DCurrentUserDropdown variant="main" />
        </div>
      </div>
    </VAppBar>
    <VAppBar :order="-1" :height="39" elevation="0" class="system-border-b">
      <slot name="second-bar">
        <div class="d-flex flex-column w-100 px-1 align-center">
          <div class="d-flex justify-space-between w-100 align-center">
            <div class="d-flex align-center">
              <VBtn
                :active="sidebarLeft"
                @click.stop="sidebarLeft = !sidebarLeft"
                icon
                :width="30"
                :height="30"
                :color="sidebarLeft ? 'secondary' : undefined"
                :variant="sidebarLeft ? 'flat' : 'text'"
              >
                <VIcon icon="mdi-tune" :size="16" />
                <VTooltip activator="parent" location="bottom">Filters</VTooltip>
              </VBtn>
              <slot name="second-bar-left"></slot>
            </div>
            <div class="d-flex align-center">
              <slot name="second-bar-right"></slot>
              <VBtn
                :active="sidebarRight"
                @click.stop="sidebarRight = !sidebarRight"
                icon
                :width="30"
                :height="30"
                :variant="sidebarRight ? 'flat' : 'text'"
                :color="sidebarRight ? 'secondary' : undefined"
              >
                <VIcon icon="mdi-information-outline" :size="16" />
                <VTooltip activator="parent" location="bottom">Info</VTooltip>
              </VBtn>
            </div>
          </div>
        </div>
      </slot>
    </VAppBar>
    <VDialog v-if="customDialog" :model-value="true" fullscreen persistent no-click-animation class="overlay--sidebar">
      <VCard>
        <slot name="custom-dialog"></slot>
      </VCard>
    </VDialog>
    <VAppBar v-else location="bottom" :height="customFooterHeight" elevation="0" class="overflow-visible">
      <div class="w-100 h-100 overflow-visible">
        <div class="position-relative w-100 overflow-visible" style="height: 0">
          <AssetFooterUploadOverlay />
        </div>
        <div class="asset-footer position-relative d-flex flex-column justify-space-between w-100 h-100">
          <slot name="custom-footer"></slot>
        </div>
      </div>
    </VAppBar>
    <VMain style="height: 100vh">
      <VContainer class="pa-3 h-100 overflow-y-auto" fluid>
        <slot></slot>
      </VContainer>
      <AssetUpload />
    </VMain>
  </VLayout>
</template>
