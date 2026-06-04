import { describe, it, expect } from 'vitest'
import { planHasFeature } from './plans'

describe('planHasFeature', () => {
  it('free plan cannot use slack_integration', () => {
    expect(planHasFeature('free', 'slack_integration')).toBe(false)
  })

  it('pro plan can use slack_integration', () => {
    expect(planHasFeature('pro', 'slack_integration')).toBe(true)
  })

  it('pro plan cannot use custom_sla_rules', () => {
    expect(planHasFeature('pro', 'custom_sla_rules')).toBe(false)
  })

  it('enterprise plan can use all features', () => {
    expect(planHasFeature('enterprise', 'slack_integration')).toBe(true)
    expect(planHasFeature('enterprise', 'sso_auth')).toBe(true)
    expect(planHasFeature('enterprise', 'custom_sla_rules')).toBe(true)
  })

  it('higher plans can always use lower-plan features', () => {
    expect(planHasFeature('enterprise', 'public_api')).toBe(true)
    expect(planHasFeature('pro', 'public_api')).toBe(true)
  })
})
