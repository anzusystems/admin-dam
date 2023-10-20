/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY, EPISODE_TITLE, VIDEO_SHOW_TITLE } from '../../utils/common'

let VIDEO_SHOW_ID = ''
let EPISODE_ID = ''
describe(`Test video shows function, Env: ${CY.cfg}`,{ tags: '@videoShow', env: { visitBaseUrl: false } }, () => {
  it('Create video show', () => {
    cy.visit('/settings')
    cy.visitSubpage('video-show-settings', 'video-show', 'Video relácie')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('videoShow-title').type(VIDEO_SHOW_TITLE)
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCy('button-confirm').click()
    cy.alertMessage(ALERT_CREATE)
    cy.contains(`${VIDEO_SHOW_TITLE}`).click()
    cy.cardLoad()
    cy.getCyVisibleClick('videoShow-list')
    cy.getCy('video-show-id')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        cy.getCyVisibleClick('button-close')
        cy.urlNotContains(text)
        cy.urlContains('/video-show')
        VIDEO_SHOW_ID = text
      })
  })
  it('Edit video show', ()=>{
    cy.visit('/video-show')
    cy.getCy('filter-string').first().type(`${VIDEO_SHOW_ID}{ENTER}`)
    cy.cardLoad()
    cy.getCyVisibleClick('table-edit')
    cy.urlContains('/edit')
    cy.cardLoad()
    //eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get('.v-card-text').find('input').clear().type(`${VIDEO_SHOW_TITLE}-edit`)
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
    cy.getCyVisibleClick('button-close')
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
  })
  it('Create episode', () =>{
    cy.visit(`/video-show/${VIDEO_SHOW_ID}`)
    cy.getCy('button-create').click()
    cy.getCy('episode-title').find('input').clear().type(`${EPISODE_TITLE}-edit`)
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCy('button-confirm').click()
    cy.alertMessage(ALERT_CREATE)
    cy.contains(`${EPISODE_TITLE}`).click()
    cy.cardLoad()
    cy.getCy('copy-text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        cy.getCyVisibleClick('button-close')
        cy.urlNotContains(text)
        cy.urlContains(`/video-show/${VIDEO_SHOW_ID}`)
        EPISODE_ID = text
      })
  })
  it('Edit episode', ()=>{
    cy.visit(`/video-show/${VIDEO_SHOW_ID}`)
    cy.getCy('filter-string', 10000).first().type(`${EPISODE_ID}{ENTER}`)
    cy.cardLoad()
    cy.getCyVisibleClick('table-edit')
    cy.cardLoad()
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.get('.v-card-text').find('input').clear().type(`${EPISODE_TITLE}-edit`)
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-save').click()
    cy.alertMessage(ALERT_UPDATE)
    cy.urlContains(`/episode/${EPISODE_ID}`)
    cy.getCyVisibleClick('button-close')
    cy.urlNotContains(`/episode/${EPISODE_ID}`)
    cy.urlContains(`/video-show/${VIDEO_SHOW_ID}`)
  })
})
