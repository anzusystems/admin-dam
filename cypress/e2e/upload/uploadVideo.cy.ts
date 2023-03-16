/// <reference types="cypress" />

import { VIDEO_TYPES, UPLOAD_TYPES } from '../../utils/upload'
const fileID: Array<string> = []
describe(`Test upload of various video, Env: ${Cypress.env('cfg')}`, { tags: '@video' }, () => {
  VIDEO_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Video: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.uploadFile(`video/sample.${fileType}`, uploadType)
        cy.api_getFileID(10).then((responseID) => {
          fileID.push(responseID)
          cy.waitForUpload(10)
          cy.verifyFileType(responseID, 'video', fileType)
        })
      })
    })
  })
  it('Video: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(fileID)
  })
})
