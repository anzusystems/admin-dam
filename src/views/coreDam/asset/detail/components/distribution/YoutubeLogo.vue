<script lang="ts" setup>
import { Theme, useTheme } from '@anzusystems/common-admin'
import logoDark from '@/assets/yt_logo_rgb_dark.png'
import logoLight from '@/assets/yt_logo_rgb_light.png'

const { theme } = useTheme()
</script>

<template>
  <div class="yt-logo">
    <a
      target="_blank"
      rel="noopener noreferrer"
      href="https://www.youtube.com/"
    >
      <img
        v-if="theme === Theme.Dark"
        alt="YouTube"
        :src="logoDark"
      >
      <img
        v-else
        alt="YouTube"
        :src="logoLight"
      >
    </a>
  </div>
</template>

<style lang="scss" scoped>
.yt-logo img {
  height: 38px;
  display: block;
  width: auto;
}
</style>
