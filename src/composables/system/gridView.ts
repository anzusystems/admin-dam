import { readonly, ref } from 'vue'

export const GridView = {
  Masonry: 'masonry',
  Thumbnail: 'thumbnail',
  Table: 'table',
} as const

export type GridViewType = (typeof GridView)[keyof typeof GridView]
export const GridViewDefault = GridView.Masonry

const gridView = ref<GridViewType>(GridViewDefault)

export function useGridView() {
  const setGridView = (value: GridViewType) => {
    gridView.value = value
  }

  return {
    gridView: readonly(gridView),
    setGridView,
  }
}
