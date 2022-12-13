<script lang="ts" setup>
import { PermissionCategory } from '@/types/Permission'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  text: string
  category: PermissionCategory
}>()

const emit = defineEmits<{
  (e: 'update:text', data: string): void
  (e: 'update:category', data: PermissionCategory): void
}>()

const categories = [PermissionCategory.Dam, PermissionCategory.AdminDam]
const timeout = ref()

const category = computed({
  get() {
    return props.category
  },
  set(newValue: PermissionCategory) {
    emit('update:category', newValue)
  },
})

const textDebounced = computed({
  get() {
    return props.text
  },
  set(newValue: string) {
    if (timeout.value) clearTimeout(timeout.value)
    timeout.value = setTimeout(() => {
      emit('update:text', newValue)
    }, 300)
  },
})

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div>
    <div class="full-width py-2">
      <VBtnToggle v-model="category" mandatory>
        <VBtn :value="PermissionCategory.All" small>{{ t('coreDam.permission.category.all') }}</VBtn>
        <VBtn v-for="category in categories" :key="category" :value="category">
          {{ t('coreDam.permission.category.' + category) }}
        </VBtn>
      </VBtnToggle>
    </div>
    <div class="full-width py-2">
      <VTextField
        :label="t('coreDam.permission.filter.searchAction')"
        v-model="textDebounced"
        dense
        hide-details
        outlined
        clearable
      ></VTextField>
    </div>
  </div>
</template>
