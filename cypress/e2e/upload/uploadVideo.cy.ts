/// <reference types="cypress" />

import { VIDEO_TYPES, UPLOAD_TYPES } from '../../utils/upload'
import { CY } from '../../utils/common'
const FILE_ID: Array<string> = []
describe(`Test upload of various video, Env: ${CY.cfg}`, { tags: '@video' }, () => {
  VIDEO_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Video: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.uploadFile(`video/sample.${fileType}`, uploadType)
        cy.api_getFileID(10).then((responseID) => {
          FILE_ID.push(responseID)
          cy.waitForUpload(10)
          cy.verifyFileType(responseID, 'video', fileType)
        })
      })
    })
  })
  it('Video: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(FILE_ID)
  })
})
