import gql from 'graphql-tag'

export const getLegalDocumentProjects = gql`
query getLegalDocumentProjects {
    getLegalDocumentProjects{
      id
      name
      desc
      isConsult
      creator{
      id
      }
    }
  }
`
export const getLegalDocumentProject = gql`
query getLegalDocumentProject ($id:Int!) {
    getLegalDocumentProject(id:$id){
      id
      name
      desc
      chatAiName
      chatAiGreeting
      llmCfgKbx
      llmCfgQos
      llmCfgCki
      llmCfgAsk
      llmCfgDoc
      nextCkiLabel
      nextCkiDesc 
      model
      character_desc
      temperature
      top_p
      max_tokens
      kbId
      charDescLaw
      charDescQos
      charDescCki
      promptKbx
      promptQos
      promptCki
      turnsAsk
      turnsRpt
      promptAsk
      promptAskLast
      prompt_doc
      chardesc_doc
      reference_doc
      charDescAsk
      isConsult
      qrCodeUrl
      chatAiGreeting
      chatAiAvatarUrl
      legalDocumentTemplates{
         id
        fileName
        fileUrl
      }
      creator{
      id
      }
      chatAiPeroration
      rechargeReminder
      members{
        id
        name
        role
        avatarUrl
      }
      testers{
          id
        name
    avatarUrl
    openId
    lastOperateDate
    lastPayDate
      }
    }
  }
`

export const updateLegalDocumentProject = gql`
  mutation updateLegalDocumentProject($id:Int!,$legalDocumentProject: LegalDocumentProjectUpdateInput!) {
    updateLegalDocumentProject(id:$id,legalDocumentProject: $legalDocumentProject) {
      id
      name
    }
  }
`
export const updateLegalDocumentProjectMembers = gql`
  mutation updateLegalDocumentProjectMembers($id:Int!,$memberIds: [String!]!) {
    updateLegalDocumentProjectMembers(id:$id,memberIds: $memberIds) {
      id
      name
    }
  }
`
export const updateLegalDocumentProjectTesters = gql`
  mutation updateLegalDocumentProjectTesters($id:Int!,$testerIds: [String!]!) {
    updateLegalDocumentProjectTesters(id:$id,testerIds: $testerIds) {
      id
      name
    }
  }
`
export const getUserOperators = gql`
query getUserOperators{
  getUserOperators{
    id
    name
    email
    phone
    role
    avatarUrl
    createdAt
    updatedAt
  }
}
`
export const deleteLegalDocumentProject = gql`
  mutation deleteLegalDocumentProject($id: Int!) {
    deleteLegalDocumentProject(id: $id)
  }
  `
export const copyLegalDocumentProject = gql`
  mutation copyLegalDocumentProject($projectName: String!,$id: Int!) {
    copyLegalDocumentProject(projectName: $projectName,id: $id){
        id
    }
  }
  `
export const createLegalDocumentProject = gql`
mutation createLegalDocumentProject($legalDocumentProject: LegalDocumentProjectInput!) {
    createLegalDocumentProject(legalDocumentProject: $legalDocumentProject) {
        id
    }
  }
`


