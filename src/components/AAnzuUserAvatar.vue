<script lang="ts" setup>
import type { AnzuUser } from '@anzusystems/common-admin'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    user?: AnzuUser | undefined | null
    size?: number
    containerClass?: string
  }>(),
  {
    user: undefined,
    size: 20,
    containerClass: '',
  }
)

const color = computed(() => {
  if (props.user?.avatar.color && props.user.avatar.color.length > 0) {
    return props.user.avatar.color
  }
  return '#ccc'
})

const fontSize = computed(() => {
  return props.size * 0.5 + 'px'
})

const text = computed(() => {
  if (!props.user) return ''
  if (props.user.avatar.text.length > 0) return props.user.avatar.text
  const firstNameLastName = props.user.person.firstName.charAt(0) + props.user.person.lastName.charAt(0)
  if (firstNameLastName.length > 0) return firstNameLastName
  return props.user.email.slice(0, 2)
})
</script>

<template>
  <VAvatar :color="color" class="text-uppercase" :class="containerClass">
    <div class="d-inline-flex" :style="{ fontSize: fontSize }">{{ text }}</div>
  </VAvatar>
  <div></div>
</template>
