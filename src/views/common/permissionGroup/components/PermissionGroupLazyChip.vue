<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { getValueByPath } from '@/utils/object'
import { useLazyPermissionGroup } from '@/views/common/permissionGroup/composables/lazyPermissionGroup'

const props = withDefaults(
  defineProps<{
    id?: null | number
    property?: string
    hideChip?: boolean
  }>(),
  {
    id: null,
    property: 'title',
    hideChip: false,
  }
)

const router = useRouter()

const { has, get } = useLazyPermissionGroup()

const showLoader = computed(() => {
  return props.id != null && props.id > 0 && !has(props.id)
})

const permissionGroup = computed(() => {
  return get(props.id)
})

const text = computed(() => {
  if (permissionGroup.value) {
    return getValueByPath(permissionGroup.value, props.property)
  }

  return ''
})

const onClick = () => {
  router.push({ name: ROUTE.COMMON.PERMISSION_GROUP.DETAIL, params: { id: props.id } })
}
</script>

<template>
  <div class="d-inline-flex">
    <VProgressCircular v-if="showLoader" :size="16" :width="2" indeterminate></VProgressCircular>
    <VChip
      v-else
      v-if="hideChip === false"
      rounded="lg"
      size="small"
      variant="tonal"
      @click.stop="onClick"
      link
      data-cy="permissionGroup"
    >
      {{ text }}
    </VChip>
    <span v-if="hideChip">{{ text }}</span>
  </div>
</template>
