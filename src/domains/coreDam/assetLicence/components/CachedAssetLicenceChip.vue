<script lang="ts" setup>
import { COMMON_CONFIG, useCachedItem } from '@anzusystems/common-admin'
import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'

const props = withDefaults(
  defineProps<{
    id: null | IntegerId | undefined
  }>(),
  {}
)

const router = useRouter()

const { getCachedAssetLicence } = useCachedAssetLicences()

const { cached, loaded } = useCachedItem(() => getCachedAssetLicence(props.id))

const onClick = () => {
  if (!props.id) return
  router.push({ name: '/(coreDam)/asset-licences/[id]', params: { id: props.id } })
}
</script>

<template>
  <div class="d-inline-flex">
    <span v-if="isNull(id) || isUndefined(id)">-</span>
    <VChip
      v-else
      class="pl-1"
      size="small"
      :append-icon="COMMON_CONFIG.CHIP.ICON.LINK"
      @click.stop="onClick"
    >
      <span
        v-if="cached && cached.badge.length > 0"
        class="cached-asset-licence-chip__badge mr-1"
      >
        {{ cached.badge }}
      </span>
      {{ cached?.name ?? '' }}
      <VProgressCircular
        v-if="!loaded"
        :size="12"
        :width="2"
        indeterminate
        class="ml-1"
      />
    </VChip>
  </div>
</template>

<style lang="scss">
.cached-asset-licence-chip__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background-color: rgb(0 0 0 / 50%);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
</style>
