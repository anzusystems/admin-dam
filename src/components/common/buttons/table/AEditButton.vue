<script lang="ts" setup>
withDefaults(
  defineProps<{
    recordId: number | string
    routeName: string
    buttonT?: string
    buttonClass?: string
    target?: string
    dataCy?: string
  }>(),
  {
    buttonT: 'common.button.edit',
    buttonClass: 'ml-1',
    target: '_self',
    dataCy: 'table-edit',
  }
)
</script>

<template>
  <VBtn
    :class="buttonClass"
    :data-cy="dataCy"
    :target="target"
    :to="{ name: routeName, params: { id: recordId } }"
    icon="mdi-pencil"
    size="x-small"
    variant="text"
    @click.stop="() => {}"
  >
  </VBtn>
</template>
