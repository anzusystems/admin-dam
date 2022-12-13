<script lang="ts" setup>
import { PermissionCategory, type PermissionFilter } from '@/types/Permission'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVModels } from '@vueuse/core'

const props = defineProps<{
  modelValue: PermissionFilter
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', data: PermissionFilter): void
}>()

const { modelValue } = useVModels(props, emit)

const categories = [PermissionCategory.Dam, PermissionCategory.AdminDam]
const timeout = ref()

const input = computed({
  get() {
    return modelValue.value.text
  },
  set(newValue) {
    if (timeout.value) clearTimeout(timeout.value)
    timeout.value = setTimeout(() => {
      modelValue.value.text = newValue
      emit('update:modelValue', modelValue.value)
    }, 300)
  },
})

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div>
    <div class="full-width py-2">
      <VBtnToggle v-model="modelValue.category" mandatory>
        <VBtn :value="PermissionCategory.All" small>{{ t('coreDam.permission.category.all') }}</VBtn>
        <VBtn v-for="category in categories" :key="category" :value="category">
          {{ t('coreDam.permission.category.' + category) }}
        </VBtn>
      </VBtnToggle>
    </div>
    <div class="full-width py-2">
      <VTextField
        :label="t('coreDam.permission.filter.searchAction')"
        v-model="input"
        dense
        hide-details
        outlined
        clearable
      ></VTextField>
    </div>
  </div>
</template>
