/// <reference types="cypress" />

import { IMAGE_TYPES, UPLOAD_TYPES } from '../../utils/upload'
import { ALERT_UPLOAD, CY } from '../../utils/common'
const fileIDs: Array<string> = []
describe(`Test upload of various images, Env: ${CY.cfg}`, { tags: ['@imageUpload', '@upload'] }, () => {
  IMAGE_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Image: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.prepareData(`image/sample.${fileType}`,false)
        cy.uploadFile(`image/sample.${fileType}`, uploadType, 20000)
        cy.api_getFileID().then((responseID) => {
          fileIDs.push(responseID)
          cy.waitForUpload(ALERT_UPLOAD, 20000)
          cy.verifyFileType(responseID, 'image', fileType)
        })
      })
    })
  })
  UPLOAD_TYPES.forEach((uploadType)=>{
    it(`Image: Upload Animated Gif - ${uploadType.toUpperCase()}`, () => {
      cy.prepareData('image/animation.gif',false)
      cy.uploadFile('image/animation.gif', uploadType, 20000)
      cy.api_getFileID().then((responseID) => {
        cy.waitForUpload(ALERT_UPLOAD, 20000)
        cy.visit(`/asset/${responseID}`)
        cy.api_waitPageLoad('asset-edit')
        cy.get(':nth-child(9) > .v-col-9').contains('áno')
        cy.deleteFile([responseID])
      })
    })
  })
  it('Image: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(fileIDs)
  })
})
