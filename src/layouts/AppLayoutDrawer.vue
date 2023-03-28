<script lang="ts" setup>
import { AAlerts, ASystemBar, useTheme } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { ROUTE } from '@/router/routes'
import { envConfig } from '@/services/EnvConfigService'
import ActionbarTeleportTarget from '@/components/system/ActionbarTeleportTarget.vue'
import logoFull from '@/assets/logo-adam-full.svg'
import logoNoText from '@/assets/logo-adam-no-text.svg'
import { useDisplay } from 'vuetify'
import SidebarMain from '@/components/system/sidebar/SidebarMain.vue'
import SidebarRail from '@/components/system/sidebar/SidebarRail.vue'
import SidebarAppendMain from '@/components/system/sidebar/SidebarAppendMain.vue'
import SidebarAppendRail from '@/components/system/sidebar/SidebarAppendRail.vue'

const { mobile } = useDisplay()

const drawer = ref(true)
const rail = ref(false)

const navIconClick = () => {
  if (mobile.value) {
    rail.value = false
    drawer.value = !drawer.value
    return
  }
  drawer.value = true
  rail.value = !rail.value
}

const { theme } = useTheme()
</script>

<template>
  <AAlerts />
  <VApp :theme="theme">
    <ASystemBar :current-version="envConfig.appVersion" />
    <VNavigationDrawer
      v-model="drawer"
      :rail="rail"
    >
      <SidebarMain v-show="!rail" />
      <SidebarRail
        v-show="rail"
        v-if="!mobile"
      />
      <template #append>
        <VDivider />
        <SidebarAppendMain :class="{ 'd-flex': !rail, 'd-none': rail }" />
        <SidebarAppendRail
          v-if="!mobile"
          :class="{ 'd-flex': rail, 'd-none': !rail }"
        />
      </template>
    </VNavigationDrawer>
    <VAppBar
      density="compact"
      elevation="0"
      class="system-border-b"
      :order="-1"
    >
      <div class="d-flex pr-2 w-100 justify-space-between full-width align-center">
        <div class="d-flex align-center">
          <VAppBarNavIcon
            data-cy="navbar-collapse"
            size="small"
            class="mx-1"
            @click.stop="navIconClick"
          />
        </div>
        <div class="main-logo mr-sm-2">
          <RouterLink :to="{ name: ROUTE.SYSTEM.HOMEPAGE }">
            <img
              width="104"
              height="42"
              :src="logoFull"
              alt="Admin"
              class="hidden-xs"
            >
            <img
              width="42"
              height="42"
              :src="logoNoText"
              alt="DAM"
              class="hidden-sm-and-up"
            >
          </RouterLink>
        </div>
        <KeepAlive>
          <ActionbarTeleportTarget />
        </KeepAlive>
      </div>
      <!--      <div class="d-flex justify-space-between w-100 align-center">-->
      <!--        <div class="d-flex w-100 align-center">-->
      <!--          <VAppBarNavIcon @click.stop="navIconClick" />-->
      <!--          <VSpacer />-->
      <!--          <VBtn-->
      <!--            :to="{ name: ROUTE.DAM.ASSET.LIST }"-->
      <!--            size="small"-->
      <!--            variant="text"-->
      <!--            class="mx-2"-->
      <!--            rounded="pill"-->
      <!--            :height="34"-->
      <!--          >-->
      <!--            <VIcon-->
      <!--              icon="mdi-home"-->
      <!--              :size="20"-->
      <!--              class="mr-2"-->
      <!--            /> {{ t('system.mainBar.backToAssets') }}-->
      <!--          </VBtn>-->
      <!--          <CurrentUserDropdown />-->
      <!--        </div>-->
      <!--      </div>-->
    </VAppBar>
    <!--    <VAppBar-->
    <!--      :height="46"-->
    <!--      elevation="0"-->
    <!--      class="system-border-b"-->
    <!--    >-->
    <!--      <div class="d-flex flex-column w-100 px-1 align-center">-->
    <!--        <KeepAlive>-->
    <!--          <ActionbarTeleportTarget />-->
    <!--        </KeepAlive>-->
    <!--      </div>-->
    <!--    </VAppBar>-->
    <VMain>
      <VContainer
        class="pa-2"
        fluid
      >
        <slot />
      </VContainer>
    </VMain>
  </VApp>
</template>

<style lang="scss">
.main-logo img {
  height: 38px;
  display: block;
  width: auto;
}
</style>
