import gql from 'graphql-tag'

export const createOrganization = gql`
mutation createOrganization ($admin: AdminCreateInput!,$organization: OrganizationInput!)  {
    createOrganization(admin: $admin,organization: $organization) {
        id
        name
}
  }
`

export const updateOrganization = gql`
mutation updateOrganization ($organization: OrganizationUpdateInput!)  {
    updateOrganization(organization: $organization) {
        id
        name
}
  }
`
export const deleteOrganization = gql`
  mutation deleteOrganization($id: Float!) {
    deleteOrganization(id: $id)
  }
  `
export const getAllOrganizations = gql`
query getAllOrganizations {
    getAllOrganizations {
        id
        name
        createdAt
        updatedAt
        wxAppSecret
        wxMchId
        wxSerialNo
        wxPublicKey
        apiClientCertP12
        apiClientCertPem
        apiClientKeyPem
        publicKeyPem
        uuid
        deletedAt
        completeWxTemplateId8
        reminderWxTemplateId2
        wxAppId
        wxDomainPath
  }
}
`
export const getOrganizationByPathUrl = gql`query getOrganizationByPathUrl($pathUrl: String!) {
  getOrganizationByPathUrl(pathUrl: $pathUrl) {
      id
      name
      adminId
      plan
      pathUrl
      payment
      creditCard
  }
}`

export const createWxOfficialAccountMenus = gql`
query createWxOfficialAccountMenus($orgId: Int!) {
    createWxOfficialAccountMenus(orgId: $orgId)
}
`
export const getOrganization = gql`
query getOrganization {
    getOrganization {
       id
       name
       createdAt
       updatedAt
       carouselImages
       mainImages
       modelText
       usageExamples
       lawyers
  }
}
`
