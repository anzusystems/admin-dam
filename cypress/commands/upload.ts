/// <reference types="cypress" />

import { CY } from '../utils/common'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      uploadFile(fileName: string, action: 'select' | 'drag-drop', timeout?: number): Chainable<any>

      waitForUpload(alertUpload: string, timeout?: number): Chainable<any>
      verifyFileType(fileID: string, fileGroup: 'image' | 'audio' | 'video' | 'application',
                     fileType: string): Chainable<any>

      deleteFile(fileID: Array<string>): Chainable<any>

      cacheControl(file: string): Chainable<any>
    }
  }
}

Cypress.Commands.add('deleteFile', (fileID: Array<string>) => {
  fileID.forEach((id) => {
    cy.api_deleteFile(id).then((response) => {
      expect(response.status).to.eq(204)
    })
  })
})
Cypress.Commands.add('verifyFileType',
  (fileID: string, fileGroup: 'image' | 'audio' | 'video' | 'application', fileType: string) => {
  const getFileType = (fileType: string): string => {
    if (fileType.includes('mp3')) return 'mpeg'
    else if (fileType.includes('mov')) return 'quicktime'
    else if (fileType.includes('wav')) return 'x-wav'
    else if (fileType.includes('doc')) return 'msword'
    else if (fileType.includes('xls')) return 'vnd.ms-excel'
    else if (fileType.includes('txt')) return 'plain'
    else return fileType
  }
  cy.api_getFileType(fileID).then((type) => {
    fileGroup = fileType.includes('txt') ? 'text' : fileGroup
    expect(type).to.contain(fileGroup).and.to.contain(getFileType(fileType))})
})
Cypress.Commands.add('waitForUpload', (alertUpload: string, timeout?: number = 10000) => {
  cy.contains('[data-cy="upload-overlay-title"]', alertUpload, { timeout: timeout | 90000 })
})
Cypress.Commands.add('uploadFile', (fileName: string, action: 'select' | 'drag-drop', timeout?: number = 10000) => {
  cy.get('input[type="file"]', { timeout: timeout | 10000 })
    .first()
    .selectFile(
      {
        contents: `cypress/fixtures/${fileName}`,
        mimeType: fileName.includes('wav') ? 'audio/wav' : undefined,
      },
      {
        waitForAnimations: true,
        force: true,
        action: action,
      }
    )
})

Cypress.Commands.add('cacheControl', (file: string) => {
  cy.request({
    method: 'GET',
    url: `${CY.url.proto}://imageadmin.smedatastaging.sk/image/${file}`,
  }).then((response)=>{

    // cache-control, max-age = 0
    const CACHE_MAX_AGE = parseInt(
      response.headers['cache-control'].toString().match(/max-age=(\d+)/)[1])
    expect(CACHE_MAX_AGE).to.be.eq(0)

    // cache-control - public
    expect(response.headers['cache-control']).to.include('public')

    // strict-transport-security, max-age > 0
    const SECURE_MAX_AGE = parseInt(
      response.headers['strict-transport-security'].toString().match(/max-age=(\d+)/)[1])
    expect(SECURE_MAX_AGE).to.be.gte(0)
  })

  cy.request({
    method: 'GET',
    url: `${CY.url.proto}://image.smedatastaging.sk/image/w200-h200/${file.split('/')[1]}`,
  }).then((response)=> {

    // cache-control, max-age > 0
    const CACHE_MAX_AGE = parseInt(
      response.headers['cache-control'].toString().match(/max-age=(\d+)/)[1])
    expect(CACHE_MAX_AGE).to.be.gte(0)

    // cache-control - public
    expect(response.headers['cache-control']).to.include('public')

    // strict-transport-security, max-age > 0
    const SECURE_MAX_AGE = parseInt(
      response.headers['strict-transport-security'].toString().match(/max-age=(\d+)/)[1])
    expect(SECURE_MAX_AGE).to.be.gte(0)
  })
})

export {}
