import gql from 'graphql-tag'
import { apolloClient } from '../client'
import { User } from 'src/types/user'
import { decrypted } from 'src/utils/projectUtils'
export const createGuestAccount = gql`
  query createGuestAccount {
    createGuestAccount
  }
`
export const getTemporaryOSSConfig = gql`
  query getTemporaryOSSConfig{
    getTemporaryOSSConfig
  }
  `
export const getOssCOnfig = async (): Promise<any> => {
  try {
    const res = await apolloClient.query<{ getTemporaryOSSConfig: any }>({
      query: getTemporaryOSSConfig,

      fetchPolicy: 'no-cache',
    })
    return Promise.resolve(decrypted({
      content: res.data.getTemporaryOSSConfig,
    }))
  } catch (error) {
    return Promise.reject(error)
  }
}
export const currentUser = gql`
  query currentUser {
    currentUser {
      id
      name
      email
      phone
      avatarUrl
      role
      realName
      desc
      wxUserId
      organizationId
      distributor{
        t1DistributorId
      }
    }
  }
`

export const updateUserType = gql`
  query updateUserType($userType: Int!, $userId: String!) {
    updateUserType(userType: $userType, userId: $userId) {
        name
        userType
    }
  }
  `

export const fetchMe = async (): Promise<User> => {
  try {
    const res = await apolloClient.query<{ currentUser: User }>({
      query: currentUser,
      fetchPolicy: 'no-cache',
    })
    return Promise.resolve(res.data.currentUser)
  } catch (error) {
    return Promise.reject(error)
  }
}
