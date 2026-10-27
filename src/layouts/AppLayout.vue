<script lang="ts" setup>
import { ALayoutLoader, ALayoutSwitch } from '@anzusystems/common-admin'

import AppLayoutDrawer from '@/layouts/AppLayoutDrawer.vue'
import AppLayoutFullscreen from '@/layouts/AppLayoutFullscreen.vue'
import AppLayoutMain from '@/layouts/AppLayoutMain.vue'

// The layouts pages name in `definePage({ meta: { layout } })`.
const layouts = { AppLayoutLoader: ALayoutLoader, AppLayoutMain, AppLayoutDrawer, AppLayoutFullscreen }
</script>

<template>
  <ALayoutSwitch :layouts="layouts">
    <slot />
  </ALayoutSwitch>
</template>
