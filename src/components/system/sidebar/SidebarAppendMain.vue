<script lang="ts" setup>
import { envConfig } from '@/services/EnvConfigService'
import { AAdminSwitcher, ACurrentUserDropdown } from '@anzusystems/common-admin'
import { useCurrentUser } from '@/composables/system/currentUser'
import { ROUTE } from '@/router/routes'

const { currentUser } = useCurrentUser()
</script>

<template>
  <div class="align-center justify-space-evenly py-1">
    <AAdminSwitcher :config-url="envConfig.adminSwitcherConfigUrl" />
    <ACurrentUserDropdown
      :current-user="currentUser"
      :settings-route-name="ROUTE.SYSTEM.SETTINGS"
      :logout-route-name="ROUTE.SYSTEM.LOGOUT"
    />
  </div>
</template>
