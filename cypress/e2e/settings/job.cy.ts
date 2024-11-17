/// <reference types="cypress" />

import { ALERT_CREATE, CY, JOB_DELETE, JOB_SYNC } from '../../utils/common'
const assetIDs: Array<string> = []
describe(`Test job function, Env: ${CY.cfg}`,
  { tags: ['@job', '@settings'] }, () => {
    it('Check job options', () => {
      cy.visit('/settings')
      cy.visitSubpage('job-settings', 'job', 'Systémové úlohy')
      cy.getCyVisibleClick('button-create')
      cy.getCyVisibleClick('job-select')
      cy.contains('.v-list-item', JOB_SYNC)
      cy.contains('.v-list-item', JOB_DELETE).click()
    })
    it('Prepare Test Data', ()=> {
      cy.prepareData('audio/sample.mp3',true, assetIDs)
    })
    it('Test podcast synchronization JOB', ()=>{
      cy.request(`${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/asset/licence/100000/search?limit=6
      &offset=0&order[createdAt]=desc&type=audio&status=with_file&visible=true&generatedBySystem=false&inPodcast=true`)
        .then((response)=>{
          const assetID = response.body.data[5].id
          const podcastID = response.body.data[5].podcasts[0]
          const assetTitle = response.body.data[5].texts.displayTitle
          cy.visit(`/podcast/${podcastID}`)
          cy.getCy('podcast-list').click()
          cy.getCy('podcast-id').contains(podcastID)

          cy.visit(`asset/${assetID}`)
          cy.getCy('button-podcast').click()
          cy.getCy('button-delete').click()
          cy.getCy('button-confirm-delete').click()
          cy.request('DELETE', `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/asset/${assetID}`)

          cy.visit(`asset/${assetIDs[0]}`)
          cy.get('[data-cy="custom-field-title"] textarea')
            .first().clear({ force: true }).type(`${assetTitle}`)
          cy.get('[id="anzu-asset-detail-sidebar-actions"] [data-cy="button-save"]').click()
          cy.getCy('button-podcast').should('be.visible').click()
          cy.request(`${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/podcast/${podcastID}`)
            .then((response)=>{
              const podcastTitle = response.body.texts.title
              cy.getCy('button-add-new-podcast-episode').should('be.visible').click()
              cy.getCy('field-choose-podcast').type(podcastTitle)
              cy.waitSec(1)
              cy.get('.v-list-item').contains(podcastTitle).click()
              cy.getCy('field-title-podcast').clear().type(assetTitle)
              cy.getCy('button-add').should('be.visible').click()
              cy.alertMessage(ALERT_CREATE)
              cy.get('.sidebar-info .v-chip').contains(podcastTitle)

              cy.getCy('button-slots').click()
              cy.get('.sidebar-info__content .mdi-dots-horizontal').click()
              cy.getCy('button-slot-switch').click()
              cy.getCy('button-choose-slot').click()
              cy.get('.v-list').eq(1).contains('premium').click()
              cy.waitSec(0.5)
              cy.getCy('button-unset').click()
              cy.waitSec(1)
              cy.get('button.v-btn:contains("Znovu načítať sloty assetu")').click()
              cy.get(':nth-child(2) > .v-row > :nth-child(1)')
                .invoke('text').then((premiumText)=> {
                cy.wrap(premiumText).should('include', 'Súbor je neprístupný')
                cy.wrap(premiumText).should('include', 'premium')
                cy.wrap(premiumText).should('include', 'Hlavný súbor')
              })
              cy.visit('/job')
              cy.getCy('button-create').click()
              cy.getCy('job-select').click()
              cy.get('.v-list-item').contains('Podcastový synchronizátor').click()
              cy.getCy('podcastId').type(podcastID)
              cy.get('.v-overlay .v-card .v-btn').contains('Vytvoriť').click()
              cy.alertMessage(ALERT_CREATE)
              cy.get(':nth-child(1) > :nth-child(2) > .v-chip > .v-chip__content')
                .should('include.text', 'Podcastový synchronizátor')
              cy.waitForJob()
              cy.visit(`asset/${assetIDs[0]}`)
              cy.getCy('button-distribution').click()
              cy.get('.sidebar-info__content .text-body-2', { timeout: 30000 }).contains('Distribuovaný')

              cy.getCy('button-slots').click()
              cy.get(':nth-child(1) > .v-row > :nth-child(1)')
                .invoke('text').then((freeTextBlock)=> {
                cy.wrap(freeTextBlock).should('include', 'Súbor je neprístupný')
                cy.wrap(freeTextBlock).should('include', 'free')
              })
              cy.get(':nth-child(2) > .v-row > :nth-child(1)')
                .invoke('text').then((premiumTextBlock)=> {
                cy.wrap(premiumTextBlock).should('include', 'Súbor je prístupný')
                cy.wrap(premiumTextBlock).should('include', 'premium')
                cy.wrap(premiumTextBlock).should('include', 'Hlavný súbor')
                cy.wrap(premiumTextBlock).should('include', 'sample')
              })
          })
        })
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(assetIDs)
    })
})
