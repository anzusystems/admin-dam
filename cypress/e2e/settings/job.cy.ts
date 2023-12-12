/// <reference types="cypress" />

import { CY, JOB_DELETE, JOB_SYNC } from '../../utils/common'

describe(`Test job function, Env: ${CY.cfg}`,
  { tags: ['@job', '@settings'], env: { visitBaseUrl: false } }, () => {
  it('Check job options', () => {
    cy.visit('/settings')
    cy.visitSubpage('job-settings', 'job', 'Systémové úlohy')
    cy.getCyVisibleClick('button-create')
    cy.getCyVisibleClick('job-select')
    cy.contains('.v-list-item', JOB_SYNC)
    cy.contains('.v-list-item', JOB_DELETE).click()
  })
})
