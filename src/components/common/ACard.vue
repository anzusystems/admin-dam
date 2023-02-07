<script lang="ts" setup>
withDefaults(
  defineProps<{
    variant?: string
    loading?: boolean
    innerDivClass?: string
    title?: string
  }>(),
  {
    variant: 'flat',
    loading: undefined,
    innerDivClass: 'pa-2',
    title: undefined,
  }
)
</script>

<template>
  <VCard :title="title" :variant="variant" class="position-relative" :loading="loading">
    <!--    <div class="progress-container">-->
    <!--      <VProgressLinear v-if="loading" :active="true" color="primary" height="3" indeterminate rounded />-->
    <!--    </div>-->
    <div :class="innerDivClass">
      <slot />
    </div>
    <div v-show="loading" class="a-overlay" />
  </VCard>
</template>

<style lang="scss" scoped>
//.progress-container {
//  height: 3px;
//  width: 100%;
//}

.a-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(0 0 0 / 10%);
  z-index: 5;
}
</style>
