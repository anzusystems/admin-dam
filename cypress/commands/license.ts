/// <reference types="cypress" />

import { ALERT_UPLOAD } from '../utils/common'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Check if duplicate exist
       * @param value - [true/false] if true duplicate should exist. false - should not exist
       */
      duplicateShouldExist(value: boolean): Chainable<any>
      /**
       * Change asset licence
       * @param idLicence - licence id
       */
      changeLicence(idLicence: string): Chainable<any>
      /**
       * Provide user credentials form config/cypress.config.ts env to login, if they don't exist, use provided values.
       * @param dir - direction to needed folder
       * @param format - file format
       * @param idx - index of test per one data type
       * @param FILE_ID - Array of files id's
       */
      checkDuplicate(dir: string, format: string, idx: number, FILE_ID: string[]): Chainable<any>
      /**
       * Closes asset-upload-overlay
       */
      finishUpload(): Chainable<any>
    }
  }
}

Cypress.Commands.add('duplicateShouldExist', (value: boolean) => {
  cy.get('.dam-upload-queue--list', { timeout: 20000 })
    .find('[data-cy="icon-duplicate"]')
    .should(($element)=>{
      value ? expect($element).to.exist : expect($element).to.not.exist
    })
})

Cypress.Commands.add('changeLicence', (idLicence: string) => {
  cy.get(':nth-child(3) > .mx-1').should('be.visible').click()
  cy.getCy('button-switch-licence').should('be.visible').click()
  cy.getCy('field-change-on-id-licence').type(`${idLicence}`)
  cy.getCyVisibleClick('button-confirm')
  cy.api_waitPageLoad('main', idLicence)
})

Cypress.Commands.add('checkDuplicate', (dir: string, format: string, idx: number, FILE_ID: string[]) => {
  cy.uploadFile(`${dir}/sample.${format}`, 'select')
  cy.api_getFileID(idx)
    .then((responseID) => {
      FILE_ID.push(responseID)
    })
  cy.waitForUpload(ALERT_UPLOAD)
  cy.duplicateShouldExist(false)
  cy.uploadFile(`${dir}/sample.${format}`, 'select')
  cy.waitForUpload(ALERT_UPLOAD)
  cy.duplicateShouldExist(true)
})

Cypress.Commands.add('finishUpload', () => {
  cy.getCy('button-add-description').should('be.visible').click()
  cy.getCy('button-close').should('be.visible').click()
})

export {}
