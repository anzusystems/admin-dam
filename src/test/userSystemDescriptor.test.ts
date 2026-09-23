import { describe, expect, it } from 'vitest'
import {
  resolveCreateEndpoint,
  resolveEnabledWrite,
  resolveMetadataWrite,
  resolveProbeEndpoint,
} from '@anzusystems/common-admin'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'

describe('dam user system descriptor', () => {
  it('probes the gated path, which is the only one that can say "no access"', () => {
    // `GET /adm/v1/anzu-user/{id}` has no gating in dam at all; `/adm/users/{id}` is behind
    // `DAM_USER_READ`. It is also where the writes go, and the probe reads the way the write writes.
    expect(damUserSystemDescriptor.endpoints.probe).toBe('base')
    expect(resolveProbeEndpoint(damUserSystemDescriptor).get).toBe('/adm/users/:id')
  })

  it('never routes a write through the deprecated V1 branch', () => {
    // The whole `V1/` branch here goes through `DeprecatedUserFacade`.
    expect(resolveEnabledWrite(damUserSystemDescriptor).url).toBe('/adm/users/:id')
    expect(resolveMetadataWrite(damUserSystemDescriptor).method).toBe('PATCH')
    expect(resolveCreateEndpoint(damUserSystemDescriptor)).toBe('/adm/users')
  })

  it('reads and writes enabled on one and the same path', () => {
    const { get, url } = resolveEnabledWrite(damUserSystemDescriptor)
    expect(get).toBe(url)
  })

  it('applies one metadata profile to creating and editing alike', () => {
    // Creating used to need only an id and an e-mail here; editing needed the full set.
    expect(damUserSystemDescriptor.requiredMetadata).toBe(true)
    expect(damUserSystemDescriptor.idInput).toBe(true)
  })
})
