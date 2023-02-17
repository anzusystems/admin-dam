import svg2k from '@/assets/meta-icons/2k.svg'
import svg4k from '@/assets/meta-icons/4k.svg'
import svg8k from '@/assets/meta-icons/8k.svg'
import svgqhd from '@/assets/meta-icons/qhd.svg'
import svgfhd from '@/assets/meta-icons/fhd.svg'
import svgslot from '@/assets/meta-icons/slot.svg'
import svglow from '@/assets/meta-icons/low.svg'
import svgrss from '@/assets/meta-icons/rss.svg'

export const DIMENSIONS_CONFIG = [
  {
    title: 'FullHD',
    width: 1920,
    height: 1080,
    svgSrc: svgfhd,
  },
  {
    title: '2K',
    width: 2048,
    height: 1080,
    svgSrc: svg2k,
  },
  {
    title: 'QHD',
    width: 2560,
    height: 1440,
    svgSrc: svgqhd,
  },
  {
    title: '4K',
    width: 3840,
    height: 2160,
    svgSrc: svg4k,
  },
  {
    title: '8K',
    width: 7680,
    height: 4320,
    svgSrc: svg8k,
  },
]
export const ICON_SLOTS = svgslot
export const ICON_RSS = svgrss
export const ICON_LOW = svglow
export const LOW_DIMENSION = 600
