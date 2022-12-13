<script lang="ts" setup>
const LOGIN_URL_TEMP = 'http://core.sme.localhost/login'
</script>

<template>
  <div class="py-5">
    <VBtn :href="LOGIN_URL_TEMP" color="primary" size="large">Log in</VBtn>
  </div>
</template>
