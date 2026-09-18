<script lang="ts" setup>
import { dateTimeEndOfDay, dateTimeStartOfDay, type Log } from '@anzusystems/common-admin'
import { ALogListView, type LogTypeType } from '@anzusystems/common-admin/labs'
import { LOG_SYSTEM } from '@/domains/system/logSystems'
import { allowedTimeIntervalValuesSubject } from '@/domains/system/composables/timeInterval'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

definePage({
  meta: {
    layout: 'AppLayoutDrawer',
    requiresAuth: true,
    requiredPermissions: [],
    superAdminOf: 'dam',
  },
})

const route = useRoute('/(common)/logs/dam/[type]')
const type = computed(() => route.params.type as LogTypeType)

// The one admin that always bounded its log query. Computed once per mount, as the old
// module-level default was -- see the staleness note in ADMIN-LOGY-PLAN.md 4.5.
const defaultTimeWindow = { from: dateTimeStartOfDay(-1), to: dateTimeEndOfDay() }

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.log.list'), routeName: '/(common)/logs/dam/[type]', routeParams: { type: type.value } },
  ])
)

const detailRoute = (log: Log) => ({
  name: '/(common)/logs/dam/[type]/[id]' as const,
  params: { type: type.value, id: log.id },
})

const typeRoute = (next: LogTypeType) => ({
  name: '/(common)/logs/dam/[type]' as const,
  params: { type: next },
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs" />
  <!--
    Keyed on the type: the view binds its endpoint, columns and filter visibility at mount, so a
    type change has to remount it rather than update it in place.
  -->
  <ALogListView
    :key="type"
    :client="LOG_SYSTEM.client"
    :system="LOG_SYSTEM.apiSystem"
    :type="type"
    :log-paths="LOG_SYSTEM.logPaths"
    :allowed-time-intervals="allowedTimeIntervalValuesSubject"
    :default-time-window="defaultTimeWindow"
    :detail-route="detailRoute"
    :type-route="typeRoute"
  />
</template>
