<script lang="ts" setup>
import { useLogOneStore } from '@/stores/common/logStore'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ALogLevelChip, dateTimeFriendly } from '@anzusystems/common-admin'

const { log } = storeToRefs(useLogOneStore())

const { t } = useI18n()

const formattedJSON = (data: string) => {
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  } catch (e) {
    return data
  }
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VRow>
        <VCol cols="3">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.id') }}
          </h4>
          {{ log.id }}
        </VCol>
        <VCol cols="3">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.levelName') }}
          </h4>
          <ALogLevelChip :level="log.levelName" />
        </VCol>
        <VCol cols="2">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.context.userId') }}
          </h4>
          {{ log.context.userId }}
        </VCol>
        <VCol cols="2">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.context.appVersion') }}
          </h4>
          {{ log.context.appVersion }}
        </VCol>
        <VCol cols="2">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.context.requestOriginAppVersion') }}
          </h4>
          {{ log.context.requestOriginAppVersion }}
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="4">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.context.contextId') }}
          </h4>
          {{ log.context.contextId }}
        </VCol>
        <VCol cols="4">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.context.ip') }}
          </h4>
          {{ log.context.ip }}
        </VCol>
        <VCol cols="4">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.datetime') }}
          </h4>
          {{ dateTimeFriendly(log.datetime) }}
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.message') }}
          </h4>
          <pre>{{ log.message }}</pre>
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="6">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.context.path') }}
          </h4>
          {{ log.context.method }} {{ log.context.path }}
        </VCol>
        <VCol cols="6">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.context.httpStatus') }}
          </h4>
          {{ log.context.httpStatus }}
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.context.content') }}
          </h4>
          <pre>{{ formattedJSON(log.context.content ?? '') }}</pre>
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12">
          <h4 class="text-subtitle-2">
            {{ t('common.log.model.context.response') }}
          </h4>
          <pre>{{ formattedJSON(log.context.response) }}</pre>
        </VCol>
      </VRow>
    </VCol>
  </VRow>
</template>

<style lang="scss" scoped>
pre {
  overflow: auto;
}
</style>
