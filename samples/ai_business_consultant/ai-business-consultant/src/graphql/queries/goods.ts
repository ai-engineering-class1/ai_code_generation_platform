import gql from 'graphql-tag'

export const createCommodity = gql`
mutation createCommodity ($commodity: CommodityInput!,$lawyerIds: [String!]!)  {
    createCommodity(commodity: $commodity,lawyerIds: $lawyerIds) {
        name

}
  }
`

export const updateCommodity = gql`
mutation updateCommodity ($id: Int!,$commodity: CommodityInput!,$lawyerIds: [String!]!)  {
    updateCommodity(id: $id,commodity: $commodity,lawyerIds: $lawyerIds){
        name
    }
  }
`
export const setOfflineCommodity = gql`
mutation setOfflineCommodity ($id: Int!)  {
    setOfflineCommodity(id: $id)
  }
`
export const copyCommodity = gql`
mutation copyCommodity ($id: Int!,$legalDocumentProjectId: Int!
$name: String!)  {
    copyCommodity(id: $id,legalDocumentProjectId: $legalDocumentProjectId,name: $name){
    id
    }
  }
`
export const setReleaseCommodity = gql`
mutation setReleaseCommodity ($id: Int!)  {
    setReleaseCommodity(id: $id)
  }
`
export const deleteCommodity = gql`
  mutation deleteCommodity($id: Int!) {
    deleteCommodity(id: $id)
  }
  `
export const getCommoditys = gql`
query getCommoditys  {
    getCommoditys {
        id
        name
        uuid
        qrCode
        validDays
        h5Link
        legalDocumentProjectId
        price
        availableQueries
        legalDocumentProject{
            id
            name
        }
        lawyers{
        id
        name
        }
        createdAt
        updatedAt
        mainImg
        description
        marketPrice
        details
        carouselImgs
        detailImgs
        status
        creatorId
        stock
        state
  }
}
`

export const updateCommodityByDistributor = gql`
mutation updateCommodityByDistributor ($id: Int!,$commodity: CommodityDistributorInput!,$lawyerIds: [String!]!)  {
    updateCommodityByDistributor(id: $id,commodity: $commodity,lawyerIds: $lawyerIds){
        name
    }
  }
`
