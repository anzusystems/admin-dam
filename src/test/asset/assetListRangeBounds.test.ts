import { describe, expect, it } from 'vitest'

import { withRangeLowerBounds } from '@/domains/coreDam/asset/api/assetApi'

/*
 * core-dam indexes a missing width, height, duration … as 0, so an upper bound on its own matched every asset
 * without that property (DAM-B10). The list sends such a bound with a lower bound of 1.
 */

describe('the ranges of the asset list search', () => {
  it('sends an upper bound on its own with a lower bound of 1', () => {
    const data = withRangeLowerBounds({ widthFrom: null, widthUntil: 500, durationFrom: '', durationUntil: 60 })

    expect(data.widthFrom).toBe(1)
    expect(data.durationFrom).toBe(1)
    expect(data.widthUntil).toBe(500)
    expect(data.durationUntil).toBe(60)
  })

  it('keeps a lower bound that is set, 0 included', () => {
    const data = withRangeLowerBounds({ widthFrom: 0, widthUntil: 500, heightFrom: 200, heightUntil: 300 })

    expect(data.widthFrom).toBe(0)
    expect(data.heightFrom).toBe(200)
  })

  it('leaves a range without an upper bound, and the ranges where 0 is a value, alone', () => {
    const filterData = { widthFrom: null, widthUntil: null, rotationFrom: null, rotationUntil: 90 }
    const data = withRangeLowerBounds(filterData)

    expect(data).toBe(filterData)
    expect(data.rotationFrom).toBeNull()
  })

  it('does not change the filter the list shows', () => {
    const filterData = { widthFrom: null, widthUntil: 500 }
    withRangeLowerBounds(filterData)

    expect(filterData.widthFrom).toBeNull()
  })
})
