<script lang="ts" setup>
import type LogDatatableType from '@/views/common/log/components/LogDatatable.vue'
import LogDatatable from '@/views/common/log/components/LogDatatable.vue'
import { useLogFilter } from '@/model/common/filter/LogFilter'
import { computed, ref, watch } from 'vue'
import { ACard, isNull } from '@anzusystems/common-admin'
import LogFilter from '@/views/common/log/components/LogFilter.vue'
import { useLogListActions } from '@/views/common/log/composables/logActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const logFilter = useLogFilter()
const activeTab = ref<null | string>(null)
const datatables = ref<{ [key: string]: InstanceType<typeof LogDatatableType> | null }>({})
const counts = ref<Record<string, string>>({})

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
  <ActionbarWrapper />

  <ACard :loading="listLoading">
    <VCardText>
      <LogFilter
        @submit-filter="submitFilter"
        @reset-filter="resetFilter"
      />
      <VTabs
        v-if="systems.length > 1"
        v-model="activeTab"
        color="primary"
      >
        <VTab
          v-for="system in logFilter.system.model"
          :key="system"
          :value="system"
        >
          <span>{{ system }}</span>
          <VChip
            v-if="counts[system]"
            class="ml-1"
            size="small"
          >
            {{ counts[system] }}
          </VChip>
        </VTab>
      </VTabs>
      <div
        v-for="system in logFilter.system.model"
        v-show="system === activeTab"
        :key="system"
      >
        <LogDatatable
          :key="system"
          :ref="
            (el) => {
              datatables[system] = el as any
            }
          "
          :system="system"
          @count-change="updateCount($event, system)"
        />
      </div>
    </VCardText>
  </ACard>
</template>
