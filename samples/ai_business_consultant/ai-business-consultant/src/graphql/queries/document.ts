import gql from 'graphql-tag'


export const updatePaperwork = gql`
mutation updatePaperwork ($id: Int!,$paperwork: PaperworkUpdateInput!)  {
    updatePaperwork(id: $id,paperwork: $paperwork){
        id
    }
  }
`
export const getPaperworkGenerateWebofficeToken = gql`
query getPaperworkGenerateWebofficeToken ($id: Int!)  {
    getPaperworkGenerateWebofficeToken(id: $id)
  }
`
export const sendPaperworkToWxUser = gql`
mutation sendPaperworkToWxUser ($id: Int!)  {
    sendPaperworkToWxUser(id: $id)
  }
`
export const refreshWebofficeToken = gql`
query refreshWebofficeToken ($accessToken: String!,$refreshToken: String!)  {
    refreshWebofficeToken(accessToken: $accessToken,refreshToken: $refreshToken)
  }
`
export const notiPaperworkToWxUser = gql`
mutation notiPaperworkToWxUser ($id: Int!)  {
    notiPaperworkToWxUser(id: $id)
  }
`
export const getPaperworks = gql`
query getPaperworks{
    getPaperworks {
        id
        legalDocumentProject{
            name
            legalDocumentTemplates{
                fileUrl
            }
        }
        state
        docJson
        fileUrl
        chatJson
        errorInfo
        confirmedAt
        dataJson
        reviewDocJson
        wxUser{
            id
            name
            avatarUrl
            openId
        }
        wxPaidOrders{
            out_trade_no
            commodity{
            name
            }
        }
        aiFileUrl
  }
}
`
export const getPaperworksAndCount = gql`
query getPaperworksAndCount ($take: Int!,$skip: Int!,$state: String!,$out_trade_no: String){
    getPaperworksAndCount (take: $take,skip: $skip,state: $state,out_trade_no: $out_trade_no) {
     totalCount
        data{
        id
        legalDocumentProject{
            name
            legalDocumentTemplates{
                fileUrl
            }
        }
        state
        docJson
        fileUrl
        chatJson
        errorInfo
        confirmedAt
        dataJson
        reviewDocJson
        wxUser{
            id
            name
            avatarUrl
            openId
        }
        wxPaidOrders{
            out_trade_no
            commodity{
            name
            }
        }
        aiFileUrl
}
  }
}
`
export const getPaperworkById = gql`
query getPaperworkById($id: Int!){
    getPaperworkById(id: $id) {
        id
        legalDocumentProject{
            name
            legalDocumentTemplates{
                fileUrl
            }
        }
        state
        docJson
        fileUrl
        chatJson
        dataJson
        errorInfo
        confirmedAt
        reviewDocJson
        wxUser{
            id
            name
            avatarUrl
            openId
        }
        wxPaidOrders{
            out_trade_no
        }
  }
}
`
