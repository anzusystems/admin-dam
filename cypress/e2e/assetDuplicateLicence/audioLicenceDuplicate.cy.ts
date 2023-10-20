/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { AUDIO_TYPES } from '../../utils/upload'
let idLicence = ''
let FILE_ID: Array<string> = []

describe(`Test asset audio licence duplicate function, Env: ${CY.cfg}`,
  { tags: '@assetAudioLicence', env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('audio/sample.mp3', 0)
      cy.prepareData('audio/sample.wav', 0)
      cy.prepareData('audio/sample.m4a', 0)
    })
    it('Cms-sys | CMS licence', () => {
      cy.visit(`/asset`)
      cy.api_waitPageLoad('licence-unknown')
      idLicence = '100000'
      cy.getCy('button-manage-licence', 60000).should('be.visible')
        .invoke('text')
        .then((text)=>{
          const actualLicence = text.trim()
          if (actualLicence !== 'CMS licence'){
            cy.changeLicence(idLicence)
          }
        })
      let idx = 0
      AUDIO_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('audio', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-sys | cms32630',()=>{
      cy.visit(`/asset`)
      cy.api_waitPageLoad('main', idLicence)
      idLicence = '200010'  // cms32630
      cy.changeLicence(idLicence)
      let idx = 0
      AUDIO_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('audio', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Delete uploaded audios', ()=>{
      cy.deleteFile(FILE_ID)
    })
    it('Back to main cms licence', ()=>{
      cy.visit(`/asset`)
      cy.api_waitPageLoad('main', idLicence)
      idLicence = '100000'
      cy.changeLicence(idLicence)
    })
  })
