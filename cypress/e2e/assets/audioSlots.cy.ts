/// <reference types="cypress" />

import { ALERT_UPDATE, CY } from '../../utils/common'
const assetIDs: Array<string> = []

describe(`Test audio slots function, Env: ${CY.cfg}`,
  { tags: ['@audioSlots', '@assets'], env: { visitBaseUrl: false } }, () => {
  it('Prepare Test Data', () => {
    cy.visit('/')
    cy.prepareData('audio/sample.mp3', true, assetIDs)
    cy.prepareData('audio/sample2.mp3', false)
  })
  it('Public-Private', ()=>{
    cy.visit(`/asset/${assetIDs}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCy('button-slots').click()
    cy.get('button.v-btn:contains("Znovu načítať sloty assetu")').should('be.visible').click()
    cy.getCy('table-copy').should('not.exist')
    cy.get('.sidebar-info .mdi-lock-open').click()
    cy.waitSec(1)
    cy.get('.v-overlay .v-card').contains('Nastaviť ako verejné')
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCy('button-confirm').should('be.visible').click()
    cy.alertMessage(ALERT_UPDATE)
    cy.get('.mdi-content-copy').should('be.visible')
    cy.getCy('button-podcast').click()
    cy.getCy('button-slots').click()
    cy.get('.mdi-content-copy').should('be.visible')
    cy.getCy('button-meta').click()
    cy.reload()
    cy.get('.sidebar-info').contains('Súbor je prístupný')
    cy.get('.sidebar-info .mdi-content-copy').should('be.visible')
    cy.getCy('button-slots').click()
    cy.get('.sidebar-info .mdi-lock').click()
    cy.get('.mdi-content-copy').should('not.exist')
    cy.getCy('button-podcast').click()
    cy.getCy('button-slots').click()
    cy.get('.mdi-content-copy').should('not.exist')
    cy.getCy('button-meta').click()
    cy.reload()
    cy.get('.sidebar-info').contains('Súbor je neprístupný')
  })
  it('ID', ()=>{
    cy.visit(`/asset/${assetIDs}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.getCyVisibleClick('button-slot-actions')
    cy.getCy('button-slot-copy-id').should('be.visible')
  })
  it('Duplicate slot - free to premium', ()=>{
    cy.visit(`/asset/${assetIDs}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.getCyVisibleClick('button-slot-actions')
    cy.getCyVisibleClick('button-slot-duplicate')
    cy.getCyVisibleClick('button-choose-slot')
    cy.get('.v-list').should('include.text', 'premiumbonus')
    cy.get('.v-list').contains('premium').click()
    cy.getCyVisibleClick('button-unset')
    cy.get(':nth-child(2) > :nth-child(1) > .v-row > :nth-child(1)') //free slot block
      .invoke('text').then((freeText)=>{
        cy.wrap(freeText).should('include', 'Súbor je neprístupný')
        cy.wrap(freeText).should('include', 'free')
        cy.wrap(freeText).should('include', 'Hlavný súbor')
    })
    cy.get(':nth-child(2) > .v-row > :nth-child(1)') //premium slot block
      .invoke('text').then((premiumText)=>{
        cy.wrap(premiumText).should('include', 'Súbor je neprístupný')
        cy.wrap(premiumText).should('include', 'premium')
        cy.wrap(premiumText).should('include', 'Hlavný súbor')
    })
    cy.get('button.v-btn:contains("Znovu načítať sloty assetu")').click()
    cy.get(':nth-child(2) > :nth-child(1) > .v-row > :nth-child(1)') //free slot block
      .invoke('text').then((freeText)=>{
      cy.wrap(freeText).should('include', 'Súbor je neprístupný')
      cy.wrap(freeText).should('include', 'free')
      cy.wrap(freeText).should('include', 'Hlavný súbor')
    })
    cy.get(':nth-child(2) > .v-row > :nth-child(1)') //premium slot block
      .invoke('text').then((premiumText)=>{
      cy.wrap(premiumText).should('include', 'Súbor je neprístupný')
      cy.wrap(premiumText).should('include', 'premium')
      cy.wrap(premiumText).should('include', 'Hlavný súbor')
    })
    cy.getCyVisibleClick('button-podcast')
    cy.getCyVisibleClick('button-slots')
    cy.get(':nth-child(2) > :nth-child(1) > .v-row > :nth-child(1)') //free slot block
      .invoke('text').then((freeText)=>{
      cy.wrap(freeText).should('include', 'Súbor je neprístupný')
      cy.wrap(freeText).should('include', 'free')
      cy.wrap(freeText).should('include', 'Hlavný súbor')
    })
    cy.get(':nth-child(2) > .v-row > :nth-child(1)') //premium slot block
      .invoke('text').then((premiumText)=>{
      cy.wrap(premiumText).should('include', 'Súbor je neprístupný')
      cy.wrap(premiumText).should('include', 'premium')
      cy.wrap(premiumText).should('include', 'Hlavný súbor')
    })
  })
  it('Remove free file', ()=>{
    cy.visit(`/asset/${assetIDs}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.getCy('button-slot-actions').eq(0).click()
    cy.getCyVisibleClick('button-slot-remove')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCy('button-remove').should('be.visible')
    cy.getCyVisibleClick('button-unset')
    cy.get(':nth-child(2) > :nth-child(1) > .v-row > :nth-child(1)') //free slot block
      .invoke('text').then((freeText)=>{
      cy.wrap(freeText).should('include', 'free')
      cy.wrap(freeText).should('include', 'Žiaden súbor')
      expect(freeText).not.to.include('premium')
      expect(freeText).not.to.include('Hlavný súbor')
    })
    cy.get(':nth-child(2) > .v-row > :nth-child(1)') //premium slot block
      .invoke('text').then((premiumText)=>{
        cy.wrap(premiumText).should('include', 'Súbor je neprístupný')
        cy.wrap(premiumText).should('include', 'premium')
        cy.wrap(premiumText).should('include', 'Hlavný súbor')
    })
  })
  it('Add new free file', ()=>{
    cy.visit(`/asset/${assetIDs}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.get('input[type="file"]', { timeout: 10000 })
      .first()
      .selectFile(
        { contents: 'cypress/fixtures/audio/sample2.mp3' },
        { waitForAnimations: true, force: true, action: 'drag-drop' }
      )
    cy.intercept('GET', `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/asset-slot/asset/${assetIDs}?*`)
      .as('uploadApi')
    cy.wait('@uploadApi', { timeout: 30000 })
    cy.get(':nth-child(1) > .v-row > :nth-child(1)')
        .invoke('text').then((freeText)=>{
        cy.wrap(freeText).should('include', 'Súbor je neprístupný')
        cy.wrap(freeText).should('include', 'free')
        expect(freeText).not.to.include('Žiaden súbor')
        expect(freeText).not.to.include('Hlavný súbor')
      })
  })
  it('Change Slots with each other', ()=>{
    cy.visit(`/asset/${assetIDs}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.get('.sidebar-info .mdi-lock-open').eq(1).click()
    cy.waitSec(1)
    cy.getCy('button-confirm').should('be.visible').click()
    cy.alertMessage(ALERT_UPDATE)
    cy.get(':nth-child(2) > .v-row > :nth-child(1)')
        .invoke('text').then((premiumText)=>{
        cy.wrap(premiumText).should('include', 'Súbor je prístupný')
        cy.wrap(premiumText).should('include', 'premium')
        cy.wrap(premiumText).should('include', 'Hlavný súbor')
      })
    cy.getCy('button-slot-actions').eq(1).click()
    cy.getCyVisibleClick('button-slot-switch')
    cy.getCyVisibleClick('button-choose-slot')
    cy.waitSec(1)
    cy.get('.v-overlay__content > .v-list').should('include.text', 'freebonus')
    cy.get('.v-overlay__content > .v-list').contains('bonus').click()
    cy.getCyVisibleClick('button-unset')
    cy.waitSec(2)
    cy.get(':nth-child(1) > .v-row > :nth-child(1)')
        .invoke('text').then((freeText)=>{
        cy.wrap(freeText).should('include', 'Súbor je neprístupný')
        cy.wrap(freeText).should('include', 'free')
        cy.wrap(freeText).should('include', 'sample2')
        expect(freeText).not.to.include('Žiaden súbor')
      })
    cy.get(':nth-child(3) > .v-row > :nth-child(1)')
        .invoke('text').then((bonusText)=> {
        cy.wrap(bonusText).should('include', 'Hlavný súbor')
        cy.wrap(bonusText).should('include', 'Súbor je prístupný')
        cy.wrap(bonusText).should('include', 'bonus')
        cy.wrap(bonusText).should('include', 'sample')
    })
  })
  it('Twin slot', ()=>{
    cy.visit(`/asset/${assetIDs}`)
    cy.api_waitPageLoad('asset-edit')
    cy.getCyVisibleClick('button-slots')
    cy.get('.v-btn').contains('Pridať').click()
    cy.get('.asset-list-tiles__item .line-clamp-1').eq(0).invoke('text').then((twinVideoAssetTitle)=> {
      cy.get('.asset-list-tiles__item').eq(0).click()
      cy.get('.v-btn').contains('Potvrdiť').click()
      cy.get('.sidebar-info__content .v-chip--link').should('be.visible').click()
      cy.get('[data-cy="custom-field-title"] textarea[rows]')
        .should('have.value', twinVideoAssetTitle)
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')
      cy.getCyVisibleClick('button-slots')
      cy.get('.sidebar-info__content .v-chip--link').should('be.visible')
      cy.get('.mdi-trash-can-outline').click()
      cy.get('.sidebar-info__content .v-chip--link').should('not.exist')
    })
  })
  it('Delete Test data', ()=>{
    cy.deleteFile(assetIDs)
  })
})
