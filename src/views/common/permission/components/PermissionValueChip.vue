<script lang="ts" setup>
import { computed } from 'vue'
import { Grant, GrantOrigin, useGrant, useGrantOrigin } from '@anzusystems/common-admin'

const props = defineProps<{
  grant: Grant
  grantOrigin: GrantOrigin
}>()

const { getGrantOption } = useGrant()
const grantOption = computed(() => getGrantOption(props.grant))

const { getGrantOriginOption } = useGrantOrigin()
const grantOriginOption = computed(() => getGrantOriginOption(props.grantOrigin))
</script>

<template>
  <VChip :color="grantOption.color" label size="small">
    {{ grantOption.title }}
    <span v-if="grantOrigin !== GrantOrigin.DefaultGrant" class="ml-1">({{ grantOriginOption.title }})</span>
  </VChip>
</template>
