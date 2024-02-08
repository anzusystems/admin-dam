/// <reference types="cypress" />

import { ALERT_UPDATE, CY, EXTERNAL_SYS } from '../../utils/common'

describe(`Test ext system function, Env: ${CY.cfg}`,
  { tags: ['@extSystem', '@settings'], env: { visitBaseUrl: false } }, () => {
  it('Edit ext system', () => {
    cy.visit('/settings')
    cy.visitSubpage('ext-system-settings', 'ext-system', 'Externé systémy')
    cy.getCy('filter-string').last().type(`${EXTERNAL_SYS[0]}{ENTER}`)
    cy.cardLoad()
    cy.contains('td', `${EXTERNAL_SYS[0]}`).click()
    cy.cardLoad()
    cy.getCy('copy-text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
      })
    cy.getCyVisibleClick('button-edit')
    cy.urlContains('/edit')
    cy.getCy('ext-system-name').find('input').clear().type('CMS system')
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
    cy.getCyVisibleClick('button-close')
    cy.urlNotContains('/edit')
    cy.urlContains('ext-system')
    cy.getCyVisibleClick('filter-reset')
  })
})
