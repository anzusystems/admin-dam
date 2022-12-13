<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const reloadAdmin = () => {
  window.location.reload()
}
</script>

<template>
  <span v-once class="system-bar-new-version">
    {{ t('system.systemBar.newVersionText') }}
    <span class="text-decoration-underline cursor-pointer" @click.stop="reloadAdmin">
      {{ t('system.systemBar.newVersionReload') }}
    </span>
  </span>
</template>
