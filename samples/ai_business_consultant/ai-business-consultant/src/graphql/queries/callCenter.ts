import gql from 'graphql-tag'

export const createCallCenter = gql`
mutation createCallCenter($callCenter: CallCenterInput!){
  createCallCenter(callCenter:$callCenter){
    id
    number
    projectId
  }
}
`
export const updateCallCenter = gql`
mutation updateCallCenter ($id: Float!,$callCenter: CallCenterUpdateInput!)  {
  updateCallCenter(id: $id,callCenter:$callCenter) {
    id
    number
    projectId
}
  }
`

export const getAllCallCenters = gql`
query getAllCallCenters {
  getAllCallCenters {
        id
        number
        projectId
  }
}
`
export const deleteCallCenter = gql`
  mutation deleteCallCenter($id: Float!) {
    deleteCallCenter(id: $id)
  }
  `
