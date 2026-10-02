<script lang="ts" setup>
import { AActionCloseButtonHistory, ALogDetailView, defineBreadcrumbs } from '@anzusystems/common-admin'
import type { LogTypeType } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { LOG_SYSTEM } from '@/domains/system/logSystems'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

definePage({
  path: '/logs/dam/:type/:id([0-9a-f]{24})',
  meta: {
    layout: 'AppLayoutDrawer',
    requiresAuth: true,
    requiredPermissions: [],
    superAdminOf: 'dam',
  },
})

const route = useRoute('/(common)/logs/dam/[type]/[id]')
const type = computed(() => route.params.type as LogTypeType)
const id = computed(() => route.params.id as string)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.log.list'), routeName: '/(common)/logs/dam/[type]', routeParams: { type: type.value } },
    {
      title: t('breadcrumb.log.detail'),
      routeName: '/(common)/logs/dam/[type]/[id]',
      routeParams: { type: type.value, id: id.value },
    },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionCloseButtonHistory
        :fallback-route-name="'/(common)/logs/dam/[type]'"
        :fallback-route-params="{ type }"
      />
    </template>
  </ActionbarWrapper>

  <ALogDetailView
    :id="id"
    :key="`${type}/${id}`"
    :client="LOG_SYSTEM.client"
    :system="LOG_SYSTEM.apiSystem"
    :type="type"
    :log-paths="LOG_SYSTEM.logPaths"
    :fallback-route-name="'/(common)/logs/dam/[type]'"
    :fallback-route-params="{ type }"
  />
</template>
