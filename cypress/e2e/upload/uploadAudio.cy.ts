/// <reference types="cypress" />

import { AUDIO_TYPES, UPLOAD_TYPES } from '../../utils/upload'
const fileID: Array<string> = []
describe(`Test upload of various audio, Env: ${Cypress.env('cfg')}`, { tags: '@audio' }, () => {
  AUDIO_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Audio: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.uploadFile(`audio/sample.${fileType}`, uploadType)
        cy.api_getFileID(10).then((responseID) => {
          fileID.push(responseID)
          cy.waitForUpload(10)
          cy.verifyFileType(responseID, 'audio', fileType)
        })
      })
    })
  })
  it('Audio: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(fileID)
  })
})
