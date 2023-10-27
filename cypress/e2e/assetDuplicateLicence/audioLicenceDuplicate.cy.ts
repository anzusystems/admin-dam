/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { AUDIO_TYPES } from '../../utils/upload'
const FILE_ID: Array<string> = []
const main_licence = '100000'
const cms32630_licence = '200010'
describe(`Test asset audio licence duplicate function, Env: ${CY.cfg}`,
  { tags: '@assetAudioLicence', env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('audio/sample.mp3', 0)
      cy.prepareData('audio/sample.wav', 0)
      cy.prepareData('audio/sample.m4a', 0)
    })
    it('Cms-sys | CMS licence', () => {
      cy.visit('/asset')
      cy.api_waitPageLoad('main', main_licence)

      let idx = 0
      AUDIO_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('audio', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-sys | cms32630',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', main_licence)
      cy.changeLicence(cms32630_licence)

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
      cy.visit('/asset')
      cy.api_waitPageLoad('main', cms32630_licence)
      cy.changeLicence(main_licence)
    })
  })
