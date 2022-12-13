<script lang="ts" setup>
import { clickBlur } from '@/utils/event'
import { useI18n } from 'vue-i18n'
import ABtn from '@/components/common/buttons/ABtn.vue'

withDefaults(
  defineProps<{
    buttonT?: string
    buttonClass?: string
    icon?: boolean
    dataCy?: string
  }>(),
  {
    buttonT: 'common.button.save',
    buttonClass: 'ml-2',
    icon: false,
    dataCy: 'button-save',
  }
)
const emit = defineEmits<{
  (e: 'saveRecord'): void
}>()

const onClick = (event: Event) => {
  clickBlur(event)
  emit('saveRecord')
}

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ABtn
    v-if="icon"
    :class="buttonClass"
    :elevation="2"
    icon="mdi-content-save"
    size="small"
    variant="outlined"
    @click.stop="onClick"
    btn-helper="save"
  >
  </ABtn>
  <ABtn
    v-else
    :class="buttonClass"
    :data-cy="dataCy"
    color="primary"
    rounded="pill"
    @click.stop="onClick"
    btn-helper="save"
  >
    {{ t(buttonT) }}
  </ABtn>
</template>
