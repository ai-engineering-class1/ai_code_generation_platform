import gql from 'graphql-tag'

export const createLegalDocumentElement = gql`
mutation createLegalDocumentElement ($legalDocumentElement: LegalDocumentElementInput!)  {
    createLegalDocumentElement(legalDocumentElement: $legalDocumentElement) {
        name

}
  }
`

export const updateLegalDocumentElement = gql`
mutation updateLegalDocumentElement ($id: Int!,$legalDocumentElement: LegalDocumentElementUpdateInput!)  {
    updateLegalDocumentElement(id: $id,legalDocumentElement: $legalDocumentElement){
        name
    }
  }
`
export const swapLegalDocumentElementOrder = gql`
mutation swapLegalDocumentElementOrder ($id: Int!,$targetId: Int!)  {
    swapLegalDocumentElementOrder(id: $id,targetId: $targetId)
  }
`
export const deleteLegalDocumentElement = gql`
  mutation deleteLegalDocumentElement($id: Int!) {
    deleteLegalDocumentElement(id: $id)
  }
  `
export const copyLegalDocumentElement = gql`
  mutation copyLegalDocumentElement($id: Int!,$targetId: Int!) {
    copyLegalDocumentElement(id: $id,targetId: $targetId){
    id}
  }
  `
export const getLegalDocumentElements = gql`
query getLegalDocumentElements ($legalDocumentProjectId: Int!) {
    getLegalDocumentElements (legalDocumentProjectId: $legalDocumentProjectId) {
        id
        name
        desc
        spec
        sample
        questionMore
        question
        orderId
        flag
        promptAsk
        promptRef
        promptFig
        dependencyFactor
        dependencyCondOp
        dependencyValue
        parentLegalDocumentElementId
        subclassLegalDocumentElements{
        id
        name
        desc
        spec
        flag
        sample
        questionMore
        question
        dependencyFactor
        dependencyCondOp
        dependencyValue
        promptAsk
        promptRef
        promptFig
        parentLegalDocumentElementId
        }
  }
}
`

