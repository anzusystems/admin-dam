/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { AUDIO_TYPES } from '../../utils/upload'
const FILE_ID: Array<string> = []
const TESTED_LICENCE_IDS = {
  CMS_MAIN: 100000,
  CMS_SPECTATOR: 100001,
} as const
describe(`Test asset audio licence duplicate function, Env: ${CY.cfg}`,
  { tags: ['@assetAudioLicence', '@licence'], env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('audio/sample.mp3', 0)
      cy.prepareData('audio/sample.wav', 0)
      cy.prepareData('audio/sample.m4a', 0)
    })
    it('CMS-system 1', () => {
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_MAIN)

      let idx = 0
      AUDIO_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('audio', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-system 2',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_MAIN)
      cy.changeLicence(TESTED_LICENCE_IDS.CMS_SPECTATOR)

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
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_SPECTATOR)
      cy.changeLicence(TESTED_LICENCE_IDS.CMS_MAIN)
    })
  })
