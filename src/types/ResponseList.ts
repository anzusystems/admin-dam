export interface ResponseList<T> {
  data: T
  nextPage?: boolean
  totalCount?: number
}
