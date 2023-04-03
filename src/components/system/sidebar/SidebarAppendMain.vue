<script lang="ts" setup>
import { envConfig } from '@/services/EnvConfigService'
import { AAdminSwitcher } from '@anzusystems/common-admin'
import CurrentUserDropdown from '@/components/system/CurrentUserDropdown.vue'
</script>

<template>
  <div class="align-center justify-space-evenly py-1">
    <AAdminSwitcher :config-url="envConfig.adminSwitcherConfigUrl" />
    <CurrentUserDropdown />
  </div>
</template>
