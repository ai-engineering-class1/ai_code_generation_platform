import gql from 'graphql-tag'

export const getOrgLawyers = gql`
mutation getOrgLawyers{
  getOrgLawyers{
    id
    name
    avatarUrl
    createdAt
    updatedAt
    desc
    enterpriseWeChatQRCode
    lawyerQRCode
    organizationId
  }
}
`
export const createOrgLawyer = gql`
  mutation createOrgLawyer($orgLawyer: OrgLawyerInput!) {
   createOrgLawyer(orgLawyer: $orgLawyer)
  }
`;

export const updateOrgLawyer = gql`
  mutation updateOrgLawyer($orgLawyer: OrgLawyerInput!,$id: Int!) {
    updateOrgLawyer(orgLawyer: $orgLawyer,id: $id)
  }
`;

export const deleteOrgLawyer = gql`
  mutation deleteOrgLawyer($id: Int!) {
    deleteOrgLawyer(id: $id)
  }
`;


export const getOrgCarouselImages = gql`
mutation getOrgCarouselImages{
  getOrgCarouselImages{
    id
    imageUrl
    detailUrl
    createdAt
    updatedAt
    organizationId
  }
}
`
export const createOrgCarouselImage = gql`
  mutation createOrgCarouselImage($orgCarouselImage: OrgCarouselImageInput!) {
   createOrgCarouselImage(orgCarouselImage: $orgCarouselImage)
  }
`;

export const updateOrgCarouselImage = gql`
  mutation updateOrgCarouselImage($orgCarouselImage: OrgCarouselImageInput!,$id: Int!) {
    updateOrgCarouselImage(orgCarouselImage: $orgCarouselImage,id: $id)
  }
`;

export const deleteOrgCarouselImage = gql`
  mutation deleteOrgCarouselImage($id: Int!) {
    deleteOrgCarouselImage(id: $id)
  }
`;


export const getOrgMainImages = gql`
mutation getOrgMainImages{
  getOrgMainImages{
    id
    imageUrl
    detailUrl
    createdAt
    updatedAt
    organizationId
  }
}
`
export const createOrgMainImage = gql`
  mutation createOrgMainImage($orgMainImage: OrgMainImageInput!) {
   createOrgMainImage(orgMainImage: $orgMainImage)
  }
`;

export const updateOrgMainImage = gql`
  mutation updateOrgMainImage($orgMainImage: OrgMainImageInput!,$id: Int!) {
    updateOrgMainImage(orgMainImage: $orgMainImage,id: $id)
  }
`;

export const deleteOrgMainImage = gql`
  mutation deleteOrgMainImage($id: Int!) {
    deleteOrgMainImage(id: $id)
  }
`;


export const getOrgModelTexts = gql`
mutation getOrgModelTexts{
  getOrgModelTexts{
    id
    name
    downloadUrl
    createdAt
    updatedAt
    organizationId
  }
}
`
export const createOrgModelText = gql`
  mutation createOrgModelText($orgModelText: OrgModelTextInput!) {
   createOrgModelText(orgModelText: $orgModelText)
  }
`;

export const updateOrgModelText = gql`
  mutation updateOrgModelText($orgModelText: OrgModelTextInput!,$id: Int!) {
    updateOrgModelText(orgModelText: $orgModelText,id: $id)
  }
`;

export const deleteOrgModelText = gql`
  mutation deleteOrgModelText($id: Int!) {
    deleteOrgModelText(id: $id)
  }
`;

export const getOrgUsageExamples = gql`
mutation getOrgUsageExamples{
  getOrgUsageExamples{
    id
    name
    imageUrl
    detailUrl
    createdAt
    updatedAt
    organizationId
  }
}
`
export const createOrgUsageExample = gql`
  mutation createOrgUsageExample($orgUsageExample: OrgUsageExampleInput!) {
   createOrgUsageExample(orgUsageExample: $orgUsageExample)
  }
`;

export const updateOrgUsageExample = gql`
  mutation updateOrgUsageExample($orgUsageExample: OrgUsageExampleInput!,$id: Int!) {
    updateOrgUsageExample(orgUsageExample: $orgUsageExample,id: $id)
  }
`;

export const deleteOrgUsageExample = gql`
  mutation deleteOrgUsageExample($id: Int!) {
    deleteOrgUsageExample(id: $id)
  }
`;
