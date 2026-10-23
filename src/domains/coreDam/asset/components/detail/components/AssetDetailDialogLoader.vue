<script setup lang="ts">
import { useTheme } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

/* The bar of a detail while its asset is read. It knows no list: whoever draws it says what its own bar has - whether
 * it walks a list by two buttons, which of them leads nowhere, the place of the asset in that list and its name - and
 * is told of a press as that bar would be. */
withDefaults(
  defineProps<{
    walksList: boolean
    prevDisabled: boolean
    nextDisabled: boolean
    totalCountText: string
    title?: string
  }>(),
  { title: '' }
)
const emit = defineEmits<{ closeDialog: []; prevItem: []; nextItem: [] }>()

const { t } = useI18n()

const { toolbarColor } = useTheme()

const closeDialog = () => {
  emit('closeDialog')
}
</script>

<template>
  <VCard class="dam-image-detail">
    <div class="d-flex flex-column w-100 h-100">
      <VToolbar
        :color="toolbarColor"
        density="compact"
        :height="64"
        class="border-b"
      >
        <div v-if="walksList">
          <VBtn
            :aria-label="t('coreDam.asset.list.prev')"
            variant="text"
            icon
            class="mx-1"
            :width="36"
            :height="36"
            :disabled="prevDisabled"
            @click.stop="emit('prevItem')"
          >
            <VIcon icon="mdi-chevron-left" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('coreDam.asset.list.prev') }}
            </VTooltip>
          </VBtn>
          <VBtn
            :aria-label="t('coreDam.asset.list.next')"
            variant="text"
            icon
            class="mr-2"
            :width="36"
            :height="36"
            :disabled="nextDisabled"
            @click.stop="emit('nextItem')"
          >
            <VIcon icon="mdi-chevron-right" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('coreDam.asset.list.next') }}
            </VTooltip>
          </VBtn>
        </div>
        <div
          class="text-label-large d-flex"
          :class="{ 'pl-2': !walksList }"
        >
          <div
            v-if="walksList"
            class="pr-4"
          >
            {{ totalCountText }}
          </div>
          <div v-if="title">{{ title }}</div>
        </div>
        <VSpacer />
        <div>
          <VBtn
            :aria-label="t('common.button.close')"
            icon
            variant="text"
            :width="36"
            :height="36"
            class="mr-1"
            @click.stop="closeDialog"
          >
            <VIcon icon="mdi-close" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('common.button.close') }}
            </VTooltip>
          </VBtn>
        </div>
      </VToolbar>
      <div class="d-flex w-100 h-100 justify-center align-center">
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>
    </div>
  </VCard>
</template>
