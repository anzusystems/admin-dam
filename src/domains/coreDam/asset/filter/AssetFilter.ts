import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { DamAssetStatus } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'

export const filterFieldsList = [
  { name: 'text' as const, default: null, type: 'string', variant: 'search' },
  { name: 'type' as const, default: [] },
  { name: 'status' as const, default: [DamAssetStatus.WithFile] },
  { name: 'keywordIds' as const, default: [] },
  { name: 'assetAndMainFileIds' as const, default: null, type: 'string' },
  { name: 'authorIds' as const, default: [] },
  { name: 'createdByIds' as const, default: [] },
  { name: 'mostDominantColor' as const, default: [] },
  { name: 'closestMostDominantColor' as const, default: [] },
  { name: 'codecName' as const, default: [] },
  { name: 'orientation' as const, default: [] },
  { name: 'described' as const, default: null, type: 'boolean' },
  { name: 'visible' as const, default: true, type: 'boolean' },
  { name: 'generatedBySystem' as const, default: false, type: 'boolean' },
  { name: 'inPodcast' as const, default: null, type: 'boolean' },
  { name: 'fromRss' as const, default: null, type: 'boolean' },
  { name: 'ttsAudio' as const, default: null, type: 'boolean' },
  { name: 'slotNames' as const, default: [] },
  { name: 'distributedInServices' as const, default: [] },
  { name: 'licences' as const, default: [] },
  { name: 'pixelSizeFrom' as const, default: null, type: 'integer' },
  { name: 'pixelSizeUntil' as const, default: null, type: 'integer' },
  { name: 'widthFrom' as const, default: null, type: 'integer' },
  { name: 'widthUntil' as const, default: null, type: 'integer' },
  { name: 'heightFrom' as const, default: null, type: 'integer' },
  { name: 'heightUntil' as const, default: null, type: 'integer' },
  { name: 'ratioWidthFrom' as const, default: null, type: 'integer' },
  { name: 'ratioWidthUntil' as const, default: null, type: 'integer' },
  { name: 'ratioHeightFrom' as const, default: null, type: 'integer' },
  { name: 'ratioHeightUntil' as const, default: null, type: 'integer' },
  { name: 'rotationFrom' as const, default: null, type: 'integer' },
  { name: 'rotationUntil' as const, default: null, type: 'integer' },
  { name: 'durationFrom' as const, default: null, type: 'integer' },
  { name: 'durationUntil' as const, default: null, type: 'integer' },
  { name: 'bitrateFrom' as const, default: null, type: 'integer' },
  { name: 'bitrateUntil' as const, default: null, type: 'integer' },
  { name: 'slotsCountFrom' as const, default: null, type: 'integer' },
  { name: 'slotsCountUntil' as const, default: null, type: 'integer' },
  { name: 'createdAtFrom' as const, default: null, type: 'timeInterval', related: 'createdAtUntil' },
  { name: 'createdAtUntil' as const, default: null, type: 'timeInterval', exclude: true, render: { skip: true } },
  { name: 'mainFileSingleUse' as const, default: null, type: 'boolean' },
  { name: 'mainFileInternal' as const, default: null, type: 'boolean' },
] satisfies readonly MakeFilterOption[]

const listFiltersStore = createFilterStore(filterFieldsList)

export function useAssetListFilter() {
  const { filterConfig, filterData } = createFilter(filterFieldsList, listFiltersStore, {
    elastic: true,
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
