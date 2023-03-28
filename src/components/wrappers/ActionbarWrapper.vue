<script lang="ts" setup>
import { useActionbar } from '@/composables/system/actionbar'
import { computed } from 'vue'
import { useI18n } from '@anzusystems/common-admin'
import { useRoute } from 'vue-router'

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

// todo fix warning on 4 level route
const breadcrumbs = computed(() => {
  const final: any[] = []
  route.matched.forEach((value, index, array) => {
    if (value.path.length === 0) return
    if (index === array.length - 1 && props.lastBreadcrumbTitle) {
      final.push({
        title: props.lastBreadcrumbTitle,
        to: value,
      })
    } else if (value.meta.breadcrumbT) {
      final.push({
        disabled: false,
        title: value.meta.breadcrumbT ? t(value.meta.breadcrumbT as string) : '',
        to: value,
      })
    }
  })
  return final
})
</script>

<template>
  <Teleport
    v-if="canTeleport"
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
            :key="route.name"
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
