import { describe, expect, it } from 'vitest'
import { parseQuery } from 'vue-router'

import { errorPageReturnPath } from '@/router/errorPage'

// `/\t/host` passed the old check, and the URL parser drops the tab: `/error?redirect=/%09/host` opened another site.
describe('the error page return path', () => {
  it.each(['/\t/evil.example', '/\n/evil.example', '/\r/evil.example'])('refuses %j', (redirect) => {
    expect(errorPageReturnPath({ redirect })).toBe('/')
  })

  it.each(['%09', '%0A', '%0D'])('refuses /%s/evil.example from the address', (encoded) => {
    const query = parseQuery(`redirect=/${encoded}/evil.example`)
    expect(query.redirect).toBe(`/${decodeURIComponent(encoded)}/evil.example`)
    expect(errorPageReturnPath(query)).toBe('/')
  })

  it.each(['//evil.example', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)', ''])(
    'refuses %j',
    (redirect) => {
      expect(errorPageReturnPath({ redirect })).toBe('/')
    }
  )

  it('refuses a missing value and more than one value', () => {
    expect(errorPageReturnPath({})).toBe('/')
    expect(errorPageReturnPath({ redirect: null })).toBe('/')
    expect(errorPageReturnPath({ redirect: ['/articles', '/settings'] })).toBe('/')
  })

  it.each(['/articles', '/asset/123?x=1#filter=a%26b', '/articles?url=%2Fsport%2Ffutbal'])(
    'keeps %j as it is',
    (redirect) => {
      expect(errorPageReturnPath({ redirect })).toBe(redirect)
    }
  )
})
