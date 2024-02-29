/// <reference types="cypress" />

import { ALERT_UPLOAD, CY } from '../../utils/common'
const assetIDs: Array<string> = []

describe(`Test audio slots function, Env: ${CY.cfg}`,
  { tags: ['@unsplash', '@assets'], env: { visitBaseUrl: true } }, () => {
  it('test Unsplash Image', ()=>{
    cy.api_waitPageLoad('main')
    cy.get('.v-toolbar__content > .w-100 > :nth-child(2) > .v-btn').click()
    cy.get('.v-list-item').contains('Unsplash').click()
    cy.api_waitPageLoad('unsplash')
    cy.get('.v-form > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input')
      .type('Forest{ENTER}')
    cy.get('.dam-image-grid > :nth-child(1)').click()
    cy.get('.pa-2 > .bg-primary').click()
    cy.get('.dam-image-grid > :nth-child(2)').click()
    cy.get('.pa-2 > .bg-primary').click()
    cy.waitForUpload(ALERT_UPLOAD)
    cy.duplicateShouldExist(false)
    cy.getCy('button-add-description').click()
    cy.getCy('table-copy').eq(0).click()
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        assetIDs.push(text)
      })
    })
    cy.getCy('table-copy').eq(1).click()
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        assetIDs.push(text)
      })
    })
  })
  it('Visit data', ()=>{
    assetIDs.forEach((id)=>{
      cy.log(id)
      cy.visit(`/asset/${id}`)
      cy.urlContains(id)
    })
  })
  it('Delete Test data', ()=>{
    cy.deleteFile(assetIDs)
  })
})
