/// <reference types="cypress" />

import { CY } from '../utils/common'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      api_getFile(id: string, failOnStatusCode?: boolean): Chainable<any>
      api_getFileID(idx?: number = 0, timeout?: number): Chainable<string>
      api_getFileType(id: string): Chainable<string>
      api_deleteFile(id: string): Chainable<any>
      /**
       * Waits until page is loaded
       * @param pagePart - type of page that loads. main (asset's page) || asset-edit (asset edit page)
       * @param idLicence - ID of licence, default - CMS licence
       */
      api_waitPageLoad(pagePart: string = 'main', idLicence?: string = '100000'): Chainable<any>
    }
  }
}

const CORE_DAM_ASSET = (id?: string) => `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/asset/${id}`
Cypress.Commands.add('api_getFileID', (idx?: number = 0, timeout?: number) => {
  cy.intercept({
    method: 'GET',
    url: CORE_DAM_ASSET('*'),
    times: 1,
  }).as(`uploadApi${idx}`)
  cy.wait(`@uploadApi${idx}`, { timeout: timeout | 60000 }).then((data) => {
    return cy.wrap(data.response.body.id)
  })
})

Cypress.Commands.add('api_deleteFile', (id: string) => {
  cy.request('DELETE', CORE_DAM_ASSET(id))
})

Cypress.Commands.add('api_getFile', (id: string, failOnStatusCode?: boolean) => {
  cy.request({
    url: CORE_DAM_ASSET(id),
    failOnStatusCode: failOnStatusCode,
  })
})

Cypress.Commands.add('api_getFileType', (id: string) => {
  cy.request({
    url: CORE_DAM_ASSET(id),
  }).then((response) => {
    return cy.wrap(response.body.mainFile.fileAttributes.mimeType)
  })
})

Cypress.Commands.add('api_waitPageLoad', (pagePart: string = 'main', idLicence?: string = '100000') => {
  let url = ''
  switch (pagePart){
    case 'main':
      url = `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/asset/licence/${idLicence}/search?*`
      break
    case 'asset-edit':
      url = `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/user?*`
      break
    case 'licence-unknown':
      url = `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/configuration/ext-system/*`
      break
    case 'keyword':
      url = `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/keyword/*`
      break
    case 'author':
      url = `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/author/*`
      break
    case 'unsplash':
      url = `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/asset-external-provider/unsplash_cms/*`
      break
    default:
      throw new Error(`${pagePart} is unknown param`)
  }
  cy.intercept('GET', url)
    .as('loadPage')
  cy.wait('@loadPage', { timeout: 30000 })
})

export {}
