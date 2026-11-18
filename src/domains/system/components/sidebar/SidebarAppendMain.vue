<script lang="ts" setup>
import { AAdminSwitcher } from '@anzusystems/common-admin'

import CurrentUserDropdown from '@/domains/system/components/CurrentUserDropdown.vue'
import { envConfig } from '@/shared/EnvConfigService'
</script>

<template>
  <div class="align-center justify-space-evenly py-1">
    <AAdminSwitcher :config-url="envConfig.adminSwitcherConfigUrl" />
    <CurrentUserDropdown />
  </div>
</template>
