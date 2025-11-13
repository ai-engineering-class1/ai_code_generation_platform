import gql from 'graphql-tag'

export const createInformation = gql`
mutation createInformation ($information: InformationInput!)  {
    createInformation(information: $information) {
        name
}
  }
`

export const updateInformation = gql`
mutation updateInformation ($id: Int!,$information: InformationInput!)  {
    updateInformation(id: $id,information: $information) {
        name

}
  }
`
export const deleteInformation = gql`
  mutation deleteInformation($id: Int!) {
    deleteInformation(id: $id)
  }
  `
export const getOrgInformations = gql`
query getOrgInformations {
    getOrgInformations {
        id
        name
     content
  }
}
`

