/// <reference types="cypress" />

import { VIDEO_TYPES, UPLOAD_TYPES } from '../../utils/upload'
import { ALERT_UPLOAD, CY } from '../../utils/common'
const FILE_ID: Array<string> = []
describe(`Test upload of various video, Env: ${CY.cfg}`, { tags: '@video' }, () => {
  VIDEO_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Video: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.prepareData(`video/sample.${fileType}`,0)
        cy.uploadFile(`video/sample.${fileType}`, uploadType, 20000)
        cy.api_getFileID().then((responseID) => {
          FILE_ID.push(responseID)
          cy.waitForUpload(ALERT_UPLOAD, 20000)
          cy.verifyFileType(responseID, 'video', fileType)
        })
      })
    })
  })
  it('Video: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(FILE_ID)
  })
})
