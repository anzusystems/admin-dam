<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { clickBlur } from '@/utils/event'
import { useI18n } from 'vue-i18n'
import ABtn from '@/components/common/buttons/ABtn.vue'

const props = withDefaults(
  defineProps<{
    routeName: string
    recordId: number | string
    buttonT?: string
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonT: 'common.button.edit',
    buttonClass: 'ml-2',
    dataCy: 'button-edit',
  }
)
const emit = defineEmits<{
  (e: 'editRecord'): void
}>()

const { t } = useI18n({ useScope: 'global' })

const router = useRouter()

const onClick = (event: Event) => {
  clickBlur(event)
  emit('editRecord')
  router.push({ name: props.routeName, params: { id: props.recordId } })
}
</script>

<template>
  <ABtn :class="buttonClass" :data-cy="dataCy" btn-helper="edit" color="primary" rounded="pill" @click.stop="onClick">
    <span>{{ t(buttonT) }}</span>
  </ABtn>
</template>
