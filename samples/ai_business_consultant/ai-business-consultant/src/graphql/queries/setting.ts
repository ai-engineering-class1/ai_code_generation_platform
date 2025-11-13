import gql from 'graphql-tag'

export const createConfig = gql`
mutation createConfig ($config: ConfigInput!)  {
  createConfig(config: $config) {
    subject
    name
    checkReg
    smtpConfig
    imapConfig
    smsConfig
    type
    projectId
}
  }
`

export const updateConfig = gql`
mutation updateConfig ($id: Int!,$config: ConfigUpdateInput!)  {
    updateConfig(id: $id,config: $config) {
    subject
    name
    checkReg
    smtpConfig
    imapConfig
    smsConfig
    projectId
    type
}
  }
`
export const deleteConfig = gql`
  mutation deleteConfig($id: Float!) {
    deleteConfig(id: $id)
  }
  `
export const getConfigs = gql`
query getConfigs($type: Float!) {
  getConfigs(type:$type) {
    id
    subject
    name
    checkReg
    smtpConfig
    imapConfig
    smsConfig
    projectId
    type
  }
}
`
