<script lang="ts" setup>
import { useTheme } from '@/composables/system/themeSettings'
import { ref } from 'vue'
import ASidebarSettings from '@/components/system/ASidebarSettings.vue'
import ASystemBar from '@/components/system/ASystemBar.vue'
import { AAlerts } from '@anzusystems/common-admin'
import ActionbarTeleportTarget from '@/components/common/ActionbarTeleportTarget.vue'
import DCurrentUserDropdown from '@/components/system/DCurrentUserDropdown.vue'
import { useI18n } from 'vue-i18n'
import { ROUTE } from '@/router/routes'

const { t } = useI18n()

const drawer = ref<boolean>(true)

const navIconClick = () => {
  drawer.value = !drawer.value
}

const { theme } = useTheme()
</script>

<template>
  <AAlerts />
  <VApp :theme="theme">
    <ASystemBar />
    <VNavigationDrawer v-model="drawer">
      <ASidebarSettings />
    </VNavigationDrawer>
    <VAppBar :height="46" elevation="0" class="system-border-b">
      <div class="d-flex justify-space-between w-100 align-center">
        <div class="d-flex w-100 align-center">
          <VAppBarNavIcon @click.stop="navIconClick" />
          <VSpacer />
          <VBtn
            :to="{ name: ROUTE.DAM.ASSET.LIST }"
            size="small"
            variant="text"
            class="mx-2"
            rounded="pill"
            :height="34"
          >
            <VIcon icon="mdi-home" :size="20" class="mr-2" /> {{ t('system.mainBar.backToAssets') }}
          </VBtn>
          <DCurrentUserDropdown />
        </div>
      </div>
    </VAppBar>
    <VAppBar :height="46" elevation="0" class="system-border-b">
      <div class="d-flex flex-column w-100 px-1 align-center">
        <KeepAlive>
          <ActionbarTeleportTarget />
        </KeepAlive>
      </div>
    </VAppBar>
    <VMain>
      <VContainer class="pa-2" fluid>
        <slot />
      </VContainer>
    </VMain>
  </VApp>
</template>
