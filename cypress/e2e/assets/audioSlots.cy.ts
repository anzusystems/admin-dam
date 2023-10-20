/// <reference types="cypress" />

import { CY } from '../../utils/common'
let ASSET_ID: Array<string> = []

describe(`Test audio slots function, Env: ${CY.cfg}`, { tags: '@AudioSlots', env: { visitBaseUrl: false } }, () => {
  it('Prepare Test Data', () => {
    cy.visit('/')
    cy.prepareData('audio/sample.mp3', 1, ASSET_ID)
    cy.prepareData('audio/sample2.mp3', 0)
  })
  it('Public-Private', ()=>{
    cy.visit(`/asset/${ASSET_ID}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCy('button-slots').click()
    cy.get('button.v-btn:contains("Znovu načítať sloty assetu")').click()
    cy.getCy('button-open-link').should('not.exist')
    cy.get('button.v-btn:contains("Nastaviť ako verejné")').click()
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCy('button-confirm').should('be.visible').click()
    cy.getCy('button-open-link').should('be.visible')
    cy.getCy('button-podcast').click()
    cy.getCy('button-slots').click()
    cy.getCy('button-open-link').should('be.visible')
    cy.get('button.v-btn:contains("Nastaviť ako súkromné")').click()
    cy.getCy('button-open-link').should('not.exist')
    cy.getCy('button-podcast').click()
    cy.getCy('button-slots').click()
    cy.getCy('button-open-link').should('not.exist')
  })
  it('ID', ()=>{
    cy.visit(`/asset/${ASSET_ID}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.getCyVisibleClick('button-slot-actions')
    cy.getCy('button-slot-copy-id').should('be.visible')
  })
  it('Duplicate slot - free to premium', ()=>{
    cy.visit(`/asset/${ASSET_ID}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.getCyVisibleClick('button-slot-actions')
    cy.getCyVisibleClick('button-slot-duplicate')
    cy.getCyVisibleClick('button-choose-slot')
    cy.get('.v-list').should('include.text', 'premiumbonus')
    cy.get('.v-list').eq(1).click()
    cy.getCyVisibleClick('button-unset')
    cy.get(':nth-child(1) > .v-row > :nth-child(1)')
      .invoke('text').then((text)=>{
        cy.contains('Súbor je súkromný')
        cy.contains('Nastaviť ako verejné')
        cy.contains('premium')
        cy.contains('Hlavný súbor')
    })
    cy.get(':nth-child(2) > .v-row > :nth-child(1)')
      .invoke('text').then((text)=>{
      cy.contains('Súbor je súkromný')
      cy.contains('Nastaviť ako verejné')
      cy.contains('premium')
      cy.contains('Hlavný súbor')
    })
    cy.get('button.v-btn:contains("Znovu načítať sloty assetu")').click()
    cy.get(':nth-child(1) > .v-row > :nth-child(1)')
      .invoke('text').then((text)=>{
      cy.contains('Súbor je súkromný')
      cy.contains('Nastaviť ako verejné')
      cy.contains('premium')
      cy.contains('Hlavný súbor')
    })
    cy.get(':nth-child(2) > .v-row > :nth-child(1)')
      .invoke('text').then((text)=>{
      cy.contains('Súbor je súkromný')
      cy.contains('Nastaviť ako verejné')
      cy.contains('premium')
      cy.contains('Hlavný súbor')
    })
    cy.getCyVisibleClick('button-podcast')
    cy.getCyVisibleClick('button-slots')
    cy.get(':nth-child(1) > .v-row > :nth-child(1)')
      .invoke('text').then((text)=>{
      cy.contains('Súbor je súkromný')
      cy.contains('Nastaviť ako verejné')
      cy.contains('free')
      cy.contains('Hlavný súbor')
    })
    cy.get(':nth-child(2) > .v-row > :nth-child(1)')
      .invoke('text').then((text)=>{
      cy.contains('Súbor je súkromný')
      cy.contains('Nastaviť ako verejné')
      cy.contains('premium')
      cy.contains('Hlavný súbor')
    })
  })
  it('Remove free file', ()=>{
    cy.visit(`/asset/${ASSET_ID}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.getCy('button-slot-actions').eq(0).click()
    cy.getCyVisibleClick('button-slot-remove')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCy('button-remove').should('be.visible')
    cy.getCyVisibleClick('button-unset')
    cy.get(':nth-child(1) > .v-row > :nth-child(1)')
      .invoke('text').then((text)=>{
      cy.contains('free')
      cy.contains('Žiaden súbor')
      expect(text).not.to.include('premium')
      expect(text).not.to.include('Hlavný súbor')
    })
    cy.get(':nth-child(2) > .v-row > :nth-child(1)')
      .invoke('text').then((text)=>{
      cy.contains('Súbor je súkromný')
      cy.contains('Nastaviť ako verejné')
      cy.contains('premium')
      cy.contains('Hlavný súbor')
    })
  })
  it('Add new free file', ()=>{
    cy.visit(`/asset/${ASSET_ID}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.get('input[type="file"]', { timeout: 10000 })
      .first()
      .selectFile(
        { contents: `cypress/fixtures/audio/sample2.mp3` },
        { waitForAnimations: true, force: true, action: 'drag-drop' }
      )
    cy.intercept('GET', `http://core-dam.sme.localhost/api/adm/v1/asset-slot/asset/${ASSET_ID}?*`)
      .as(`uploadApi`)
    cy.wait(`@uploadApi`, { timeout: 30000 })
    cy.get(':nth-child(1) > .v-row > :nth-child(1)')
        .invoke('text').then((text)=>{
        cy.contains('free')
        cy.contains('Súbor je súkromný')
        cy.contains('Nastaviť ako verejné')
        expect(text).not.to.include('Žiaden súbor')
        expect(text).not.to.include('Hlavný súbor')
      })
  })
  it('Change Slots with each other', ()=>{
    cy.visit(`/asset/${ASSET_ID}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.get('button.v-btn:contains("Nastaviť ako verejné")').eq(1).click()
    cy.getCy('button-confirm').should('be.visible').click()
    cy.get(':nth-child(2) > .v-row > :nth-child(1)')
        .invoke('text').then((text)=>{
        cy.contains('Súbor je verejný')
        cy.contains('Nastaviť ako súkromné')
        cy.contains('premium')
        cy.contains('Hlavný súbor')
      })
    cy.getCy('button-slot-actions').eq(1).click()
    cy.getCyVisibleClick('button-slot-switch')
    cy.getCyVisibleClick('button-choose-slot')
    cy.get('.v-overlay__content > .v-list').should('include.text', 'freebonus')
    cy.get('.v-overlay__content > .v-list > :nth-child(2)').click()
    cy.getCyVisibleClick('button-unset')
    cy.get(':nth-child(1) > .v-row > :nth-child(1)')
        .invoke('text').then((text)=>{
        cy.contains('Súbor je verejný')
        cy.contains('Nastaviť ako súkromné')
        cy.contains('free')
        cy.contains('Hlavný súbor')
        expect(text).not.to.include('Žiaden súbor')
      })
    cy.getCy('button-open-link').should('be.visible')
  })
  it('Delete Test data', ()=>{
    cy.deleteFile(ASSET_ID)
  })
})
