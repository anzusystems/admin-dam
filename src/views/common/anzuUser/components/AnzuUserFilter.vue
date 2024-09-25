<script lang="ts" setup>
import { useAnzuUserFilter } from '@/model/common/filter/AnzuUserFilter'
import {
  AFilterBooleanSelect,
  AFilterInteger,
  AFilterString,
  AFilterWrapper,
  ASystemEntityScope
} from '@anzusystems/common-admin'
import { ref } from 'vue'
import PermissionGroupRemoteSelect from '@/views/common/permissionGroup/components/PermissionGroupRemoteSelect.vue'
import { useI18n } from 'vue-i18n'
import { ENTITY } from '@/services/api/common/anzuUserApi'

const emit = defineEmits<{
  (e: 'submitFilter'): void
  (e: 'resetFilter'): void
}>()

const filter = useAnzuUserFilter()
const touched = ref(false)

const { t } = useI18n()

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
</script>

<template>
  <VForm
    name="search"
    @submit.prevent="submitFilter"
  >
    <AFilterWrapper
      :touched="touched"
      enable-advanced
      @reset-filter="resetFilter"
    >
      <VRow align="start">
        <VCol
          cols="12"
          sm="2"
        >
          <AFilterInteger
            v-model="filter.id"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol
          cols="12"
          sm="5"
        >
          <AFilterString
            v-model="filter.email"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        <VCol
          cols="12"
          sm="5"
        >
          <AFilterString
            v-model="filter.lastName"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
        </VRow>

        <template #advanced>
          <VRow>
        <VCol
          cols="12"
          sm="5"
        >
          <PermissionGroupRemoteSelect
            v-model="filter.permissionGroups"
            @update:model-value="onAnyFilterUpdate"
          />
        </VCol>
      </VRow>
</template>
    </AFilterWrapper>
  </VForm>
</template>
