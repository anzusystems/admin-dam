import { reactive } from 'vue'
import { makeFilterHelper } from '@/composables/filter/filterHelpers'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/assetApi'

const makeFilter = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  _elastic: {
    ...makeFilter({ exclude: true }),
  },
  text: {
    ...makeFilter({ name: 'text' }),
  },
  type: {
    ...makeFilter({ name: 'type', default: [] }),
  },
  described: {
    ...makeFilter({ name: 'described', default: true }),
  },
  visible: {
    ...makeFilter({ name: 'visible', default: true }),
  },
  inPodcast: {
    ...makeFilter({ name: 'inPodcast', default: null }),
  },
  generatedBySystem: {
    ...makeFilter({ name: 'generatedBySystem', default: false }),
  },
  status: {
    ...makeFilter({ name: 'status', default: [] }),
  },
  mostDominantColor: {
    ...makeFilter({ name: 'mostDominantColor', default: [] }),
  },
  closestMostDominantColor: {
    ...makeFilter({ name: 'closestMostDominantColor', default: [] }),
  },
  codecName: {
    ...makeFilter({ name: 'codecName', default: [] }),
  },
  orientation: {
    ...makeFilter({ name: 'orientation', default: [] }),
  },
  licences: {
    ...makeFilter({ name: 'licences', default: [] }),
  },
  pixelSizeFrom: {
    ...makeFilter({ name: 'pixelSizeFrom', default: null }),
  },
  pixelSizeUntil: {
    ...makeFilter({ name: 'pixelSizeUntil', default: null }),
  },
  widthFrom: {
    ...makeFilter({ name: 'widthFrom', default: null }),
  },
  widthUntil: {
    ...makeFilter({ name: 'widthUntil', default: null }),
  },
  heightFrom: {
    ...makeFilter({ name: 'heightFrom', default: null }),
  },
  heightUntil: {
    ...makeFilter({ name: 'heightUntil', default: null }),
  },
  ratioWidthFrom: {
    ...makeFilter({ name: 'ratioWidthFrom', default: null }),
  },
  ratioWidthUntil: {
    ...makeFilter({ name: 'ratioWidthUntil', default: null }),
  },
  ratioHeightFrom: {
    ...makeFilter({ name: 'ratioHeightFrom', default: null }),
  },
  ratioHeightUntil: {
    ...makeFilter({ name: 'ratioHeightUntil', default: null }),
  },
  rotationFrom: {
    ...makeFilter({ name: 'rotationFrom', default: null }),
  },
  rotationUntil: {
    ...makeFilter({ name: 'rotationUntil', default: null }),
  },
  durationFrom: {
    ...makeFilter({ name: 'durationFrom', default: null }),
  },
  durationUntil: {
    ...makeFilter({ name: 'durationUntil', default: null }),
  },
  bitrateFrom: {
    ...makeFilter({ name: 'bitrateFrom', default: null }),
  },
  bitrateUntil: {
    ...makeFilter({ name: 'bitrateUntil', default: null }),
  },
})

export function useAssetListFilter() {
  return filter
}
