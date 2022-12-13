import { describe, expect, it } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { mount } from '@vue/test-utils'
import APageTitle from '../APageTitle.vue'

describe('APageTitle', () => {
  const vuetify = createVuetify({ components, directives })

  it('renders properly', () => {
    const wrapper = mount(APageTitle, {
      props: { heading: 'Edit article' },
      global: {
        plugins: [vuetify],
      },
    })
    expect(wrapper.text()).toContain('Edit article')
  })
})
