import gql from 'graphql-tag'

export const createLegalDocument = gql`
mutation createLegalDocument ($legalDocument: LegalDocumentInput!)  {
    createLegalDocument(legalDocument: $legalDocument) {
        fileName
      
}
  }
`

export const updateLegalDocument = gql`
mutation updateLegalDocument ($id: Int!,$legalDocument: LegalDocumentUpdateInput!)  {
    updateLegalDocument(id: $id,legalDocument: $legalDocument){
        fileName
    }
  }
`
export const deleteLegalDocument = gql`
  mutation deleteLegalDocument($id: Int!) {
    deleteLegalDocument(id: $id)
  }
  `
export const getLegalDocuments = gql`
query getLegalDocuments ($legalDocumentProjectId: Int!) {
    getLegalDocuments (legalDocumentProjectId: $legalDocumentProjectId) {
        id
        fileName
        fileUrl
  }
}
`

