<script lang="ts" setup>
import { useLogType } from '@/model/common/valueObject/LogType'
import { useLogFilter } from '@/model/common/filter/LogFilter'
import {
  AFilterDatetimePicker,
  AFilterInteger,
  AFilterString,
  AFilterValueObjectOptionsSelect,
  AFilterWrapper,
  useLogLevel,
} from '@anzusystems/common-admin'
import { useLogSystem } from '@/model/common/valueObject/LogSystem'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const logFilter = useLogFilter()
const touched = ref(false)

const submitFilter = () => {
  touched.value = false
  emit('submitFilter')
}

const resetFilter = () => {
  touched.value = false
  emit('resetFilter')
}

const onAnyFilterUpdate = () => {
  touched.value = true
}

const { logTypeOptions } = useLogType()
const { logLevelOptions } = useLogLevel()
const { logSystemOptions } = useLogSystem()
</script>

<template>
  <VForm
    name="search"
    @submit.prevent="submitFilter"
  >
    <AFilterWrapper
      :touched="touched"
      enable-advanced
      enable-top
      @reset-filter="resetFilter"
    >
      <VRow align="start">
        <VCol
          class="pb-0"
          cols="12"
          sm="4"
        >
          <AFilterValueObjectOptionsSelect
            v-model="logFilter.levelName"
            :items="logLevelOptions"
          />
        </VCol>
        <VCol
          cols="12"
          sm="2"
        >
          <AFilterString
            v-model="logFilter.contextId"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol
          cols="12"
          sm="3"
        >
          <AFilterDatetimePicker
            v-model="logFilter.datetimeFrom"
            disable-clearable
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol
          cols="12"
          sm="3"
        >
          <AFilterDatetimePicker
            v-model="logFilter.datetimeTo"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
      <template #top>
        <VRow align="start">
          <VCol
            class="pb-0"
            cols="12"
            sm="8"
          >
            <AFilterValueObjectOptionsSelect
              v-model="logFilter.system"
              :items="logSystemOptions"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
          <VCol
            class="pb-0"
            cols="12"
            sm="4"
          >
            <AFilterValueObjectOptionsSelect
              v-model="logFilter.type"
              :items="logTypeOptions"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
      </template>
      <template #advanced>
        <VRow align="start">
          <VCol
            cols="12"
            sm="2"
          >
            <AFilterString
              v-model="logFilter.id"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <AFilterString
              v-model="logFilter.message"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
          <VCol
            cols="12"
            sm="2"
          >
            <AFilterString
              v-model="logFilter.appVersion"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
          <VCol
            cols="12"
            sm="2"
          >
            <AFilterInteger
              v-model="logFilter.userId"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
      </template>
    </AFilterWrapper>
  </VForm>
</template>
