
export interface DistributionImagePreviewDto extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  service: string
  url: string
  selected?: boolean
  invalidImage?: boolean
}
