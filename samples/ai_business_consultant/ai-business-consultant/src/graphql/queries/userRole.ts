import gql from 'graphql-tag'

export const createRole = gql`
mutation createRole ($role: RoleInput!)  {
  createRole(role: $role) {
        id
        name
        category
}
  }
`
export const updateRole = gql`
mutation updateRole ($id: Float!,$role: RoleUpdateInput!)  {
  updateRole(id: $id,role: $role) {
        id
        name
        category
}
  }
`

export const getAllRoles = gql`
query getAllRoles {
  getAllRoles {
        id
        name
        category
  }
}
`

export const deleteRole = gql`
  mutation deleteRole($id: Float!) {
    deleteRole(id: $id)
  }
  `
