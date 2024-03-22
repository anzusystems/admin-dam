/// <reference types="cypress" />

import { CY } from '../../utils/common'
describe(`Test cache-control , Env: ${CY.cfg}`,
  { tags: ['@assets', '@cacheControl'], env: { visitBaseUrl: true } }, () => {
    if (CY.cfg !== 'stg' && CY.cfg !== 'dev'){
      it('Tests skipped - only possible in stg/dev env', ()=>{})
      return
    }
    it('cacheControl', () => {
      cy.request({
        method: 'GET',
        url: `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/asset/licence/100000/search?`+
          'limit=5&type=image&status=with_file&visible=true&generatedBySystem=false',
      }).then((response)=>{
        response.body.data.forEach((data)=>{
          const IMAGE_TABLE_URL = data.mainFile.links.image_list.url.split('image/')[1]
          cy.cacheControl(IMAGE_TABLE_URL)
        })
      })
    })
  })
