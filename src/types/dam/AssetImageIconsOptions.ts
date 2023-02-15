export interface AssetImageIconsOptions {
  show: boolean
  showSlots: boolean
  showRSS: boolean
  showLow: boolean
  showVideoDimensions: boolean
  videoDimensionsSvgSrc: string
  distributions: Array<{ id: string; svgUrl: string; name: string }>
}
