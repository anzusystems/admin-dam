<script lang="ts" setup>
import { AAlerts, ASystemBar, useTheme } from '@anzusystems/common-admin'
import { ref } from 'vue'
import ASidebarSettings from '@/components/system/SidebarSettings.vue'
import ActionbarTeleportTarget from '@/components/coreDam/ActionbarTeleportTarget.vue'
import CurrentUserDropdown from '@/components/system/CurrentUserDropdown.vue'
import { useI18n } from 'vue-i18n'
import { ROUTE } from '@/router/routes'
import { envConfig } from '@/services/EnvConfigService'

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
    <ASystemBar :current-version="envConfig.appVersion" />
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
          <CurrentUserDropdown />
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
