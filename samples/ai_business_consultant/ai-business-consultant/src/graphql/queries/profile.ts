
import Queue from '@/types/queue'
import gql from 'graphql-tag'
import { apolloClient } from '../client'



export const updateUserInfoByAdmin = gql`
mutation updateUserInfoByAdmin ($userId: String!,$user: UserUpdateInput!)  {
    updateUserInfoByAdmin(userId: $userId,user: $user) {
        name

}
  }
`
export const updateUserInfo = gql`
mutation updateUserInfo ($user: UserUpdateInput!)  {
    updateUserInfo(user: $user) {
        name
}
  }
`
export const updateUserPassword = gql`
mutation updateUserPassword ($newPassword: String!,$password: String!)  {
    updateUserPassword(newPassword: $newPassword,password: $password) {
        name
}
  }
`