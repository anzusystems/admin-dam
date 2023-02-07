<script lang="ts" setup>
import type LogDatatableType from '@/views/common/log/components/LogDatatable.vue'
import LogDatatable from '@/views/common/log/components/LogDatatable.vue'
import { useI18n } from 'vue-i18n'
import { useLogFilter } from '@/model/common/filter/LogFilter'
import { computed, ref, watch } from 'vue'
import { isNull } from '@/utils/common'
import ACard from '@/components/common/ACard.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import LogFilter from '@/views/common/log/components/LogFilter.vue'
import { useLogListActions } from '@/views/common/log/composables/logActions'

const { t } = useI18n({ useScope: 'global' })

const logFilter = useLogFilter()
const activeTab = ref<null | string>(null)
const datatables = ref<{ [key: string]: InstanceType<typeof LogDatatableType> | null }>({})
const counts = ref<any>({})

const { listLoading } = useLogListActions()

const submitFilter = () => {
  for (const system in datatables.value) {
    if (isNull(datatables.value[system])) continue
    datatables.value[system]?.submitFilter()
  }
}

const resetFilter = () => {
  for (const system in datatables.value) {
    if (isNull(datatables.value[system])) continue
    datatables.value[system]?.resetFilter()
  }
}
const updateCount = (count: string, system: string) => {
  counts.value[system] = count
}

const systems = computed<string[]>(() => {
  return logFilter.system.model?.map((item) => item.toString()) ?? []
})

watch(
  systems,
  (newValue) => {
    if (newValue.length === 0) {
      activeTab.value = null
      return
    }
    if (activeTab.value === null) {
      activeTab.value = newValue[0]
      return
    }
    if (!newValue.includes(activeTab.value)) {
      activeTab.value = newValue[0]
    }
  },
  { immediate: true }
)
</script>

<template>
  <ActionbarTitleWrapper :heading="t('common.log.meta.list')" icon="mdi-form-down" />
  <ActionbarTitleWrapper />
  <ACard :loading="listLoading">
    <LogFilter @submit-filter="submitFilter" @reset-filter="resetFilter" />
    <VTabs v-model="activeTab" v-if="systems.length > 1" color="primary">
      <VTab v-for="system in logFilter.system.model" :key="system" :value="system">
        <span>{{ system }}</span>
        <VChip v-if="counts[system]" class="ml-1" size="small">{{ counts[system] }}</VChip>
      </VTab>
    </VTabs>
    <div v-for="system in logFilter.system.model" :key="system" v-show="system === activeTab">
      <LogDatatable
        :key="system"
        :ref="(el: any) => { datatables[system] = el }"
        :system="system"
        @count-change="updateCount($event, system)"
      />
    </div>
  </ACard>
</template>
