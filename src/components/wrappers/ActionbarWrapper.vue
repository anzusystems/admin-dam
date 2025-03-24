<script lang="ts" setup>
import { useActionbar } from '@/composables/system/actionbar'
import { computed } from 'vue'
import { isString, isUndefined, stringUrlTemplateReplaceVueRouter, useI18n } from '@anzusystems/common-admin'
import { type RouteParams, type RouteRecordName, useRoute } from 'vue-router'

const props = withDefaults(
  defineProps<{
    lastBreadcrumbTitle?: string | undefined
  }>(),
  {
    lastBreadcrumbTitle: undefined,
  }
)

const { canTeleport } = useActionbar()

const { t } = useI18n()
const route = useRoute()

const parametrizeRoutePath = (to: {
  path: string
  name: string | undefined | RouteRecordName
  params: RouteParams | undefined
}) => {
  const path = stringUrlTemplateReplaceVueRouter(to.path, to.params as any)
  to.path = path
  to.params = undefined
  to.name = undefined
}

const breadcrumbs = computed(() => {
  const final: any[] = []
  route.matched
    .filter((item) => !isUndefined(item.meta.breadcrumbT))
    .forEach((value, index, array) => {
      if (value.path.length === 0) return
      const to: { path: string; name: string | undefined | RouteRecordName; params: RouteParams | undefined } = {
        path: value.path,
        name: value.name ?? undefined,
        params: { ...route.params },
      }
      if (isUndefined(to.name) && to.path.indexOf(':') > -1) parametrizeRoutePath(to)
      if (index === array.length - 1 && props.lastBreadcrumbTitle) {
        final.push({
          disabled: false,
          title: t(value.meta.breadcrumbT as string) + ': ' + props.lastBreadcrumbTitle,
          to: to,
        })
      } else if (value.meta.breadcrumbT) {
        final.push({
          disabled: false,
          title: value.meta.breadcrumbT ? t(value.meta.breadcrumbT as string) : '',
          to: to,
        })
      }
    })
  return final
})
</script>

<template>
  <Teleport
    v-if="canTeleport"
    defer
    to="#anzu-actionbar"
  >
    <div class="flex-grow-1 flex-shrink-1 min-width-0 overflow-hidden">
      <slot name="breadcrumbs">
        <div class="d-flex align-center min-width-0">
          <VBreadcrumbsDivider
            v-if="breadcrumbs.length > 0"
            class="px-1"
          >
            &raquo;
          </VBreadcrumbsDivider>
          <VBreadcrumbs
            :key="isString(route.name) ? route.name : route.fullPath"
            class="pl-1 min-width-0"
            density="compact"
          >
            <template
              v-for="(breadcrumb, index) in breadcrumbs"
              :key="breadcrumb.to.path"
            >
              <VBreadcrumbsItem
                :to="breadcrumb.to"
                :disabled="false"
                :class="{ 'min-width-0': index === breadcrumbs.length - 1 }"
              >
                <div class="v-breadcrumbs-item__text">
                  {{ breadcrumb.title }}
                </div>
              </VBreadcrumbsItem>
              <VBreadcrumbsDivider v-if="index < breadcrumbs.length - 1">
                &raquo;
              </VBreadcrumbsDivider>
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
