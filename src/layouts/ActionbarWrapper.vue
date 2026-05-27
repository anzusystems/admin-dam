<script lang="ts" setup>
import { useActionbar } from '@/composables/system/actionbar'
import { type BreadcrumbItem, type Breadcrumbs } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    breadcrumbs?: Breadcrumbs | undefined
  }>(),
  {
    breadcrumbs: undefined,
  }
)

const { canTeleport } = useActionbar()
const route = useRoute()

const breadcrumbTo = (item: BreadcrumbItem, index: number) => {
  if (
    isUndefined(props.breadcrumbs) ||
    (!props.breadcrumbs.options.linkLastItem && index === props.breadcrumbs.items.value.length - 1)
  ) {
    return undefined
  }
  if (!isUndefined(item.routeParams)) {
    return { name: item.routeName, params: { ...item.routeParams } }
  }
  if (!isUndefined(item.id)) {
    return { name: item.routeName, params: { id: item.id } }
  }
  return { name: item.routeName }
}
</script>

<template>
  <Teleport v-if="canTeleport" defer to="#anzu-actionbar">
    <div class="flex-grow-1 flex-shrink-1 min-width-0 overflow-hidden">
      <slot name="breadcrumbs">
        <div v-if="!isUndefined(breadcrumbs)" class="d-flex align-center min-width-0">
          <VBreadcrumbsDivider v-if="breadcrumbs.items.value.length > 0" class="px-1"> &raquo; </VBreadcrumbsDivider>
          <VBreadcrumbs :key="String(route.name ?? '')" class="pl-1 min-width-0" density="compact">
            <template v-for="(breadcrumb, index) in breadcrumbs.items.value" :key="breadcrumb.routeName">
              <VBreadcrumbsItem
                :to="breadcrumbTo(breadcrumb, index)"
                :disabled="false"
                :class="{ 'min-width-0': index === breadcrumbs.items.value.length - 1 }"
              >
                <div class="v-breadcrumbs-item__text">
                  {{ breadcrumb.title }}
                </div>
              </VBreadcrumbsItem>
              <VBreadcrumbsDivider v-if="index < breadcrumbs.items.value.length - 1"> &raquo; </VBreadcrumbsDivider>
            </template>
          </VBreadcrumbs>
        </div>
      </slot>
    </div>
    <div class="flex-grow-0 flex-shrink-0 pl-2">
      <slot name="buttons" />
    </div>
  </Teleport>
</template>

<style lang="scss">
.v-breadcrumbs-item__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
