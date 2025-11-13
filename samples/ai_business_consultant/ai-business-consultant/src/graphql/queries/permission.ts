import gql from 'graphql-tag'

export const updatePermission = gql`
mutation updatePermission ($id: Float!,$permission: PermissionUpdateInput!)  {
  updatePermission(id: $id,permission: $permission) {
        id
        name
        grantList
}
  }
`

export const createProjectApplicant = gql`
mutation createProjectApplicant ($projectApplicant: ProjectApplicantInput!)  {
    createProjectApplicant(projectApplicant: $projectApplicant) 
  }
`
export const updateProjectApplicant = gql`
mutation updateProjectApplicant ($roleId: Int,$state: Int!,$id: Int!)  {
    updateProjectApplicant(roleId: $roleId,state: $state,id: $id){
        userId
    }
  }
`

export const getOrgProjectApplicants = gql`
query getOrgProjectApplicants  {
    getOrgProjectApplicants{
        id
userId
userName
userEmail
note
projectId
projectName
state
    }
  }
`
export const getProjectApplicants = gql`
query getProjectApplicants ($projectId: Int!) {
    getProjectApplicants(projectId:$projectId){
        id
userId
userName
userEmail
note
projectId
projectName
state
    }
  }
`
export const getAllPermissions = gql`
query getAllPermissions($projectId:Float!) {
  getAllPermissions(projectId:$projectId) {
        id
        name
        grants
        grantList
  }
}
`
