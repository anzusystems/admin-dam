import {
  resolveCreateEndpoint,
  resolveEnabledWrite,
  resolveMetadataWrite,
  resolveProbeEndpoint,
} from '@anzusystems/common-admin'
import { describe, expect, it } from 'vitest'

import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'

describe('dam user system descriptor', () => {
  it('probes the gated path, which is the only one that can say "no access"', () => {
    // `GET /adm/v1/anzu-user/{id}` has no gating in dam. `/adm/users/{id}` is behind `DAM_USER_READ`.
    // The writes go to `/adm/users/{id}` too, and the probe reads from the same endpoint.
    expect(damUserSystemDescriptor.endpoints.probe).toBe('base')
    expect(resolveProbeEndpoint(damUserSystemDescriptor).get).toBe('/adm/users/:id')
  })

  it('never routes a write through the deprecated V1 branch', () => {
    // The whole `V1/` branch goes through `DeprecatedUserFacade`.
    expect(resolveEnabledWrite(damUserSystemDescriptor).url).toBe('/adm/users/:id')
    expect(resolveMetadataWrite(damUserSystemDescriptor).method).toBe('PATCH')
    expect(resolveCreateEndpoint(damUserSystemDescriptor)).toBe('/adm/users')
  })

  it('reads and writes enabled on one and the same path', () => {
    const { get, url } = resolveEnabledWrite(damUserSystemDescriptor)
    expect(get).toBe(url)
  })

  it('applies one metadata profile to creating and editing alike', () => {
    expect(damUserSystemDescriptor.requiredMetadata).toBe(true)
    expect(damUserSystemDescriptor.idInput).toBe(true)
  })
})
