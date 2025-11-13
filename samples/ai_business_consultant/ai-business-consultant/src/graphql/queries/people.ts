import gql from 'graphql-tag'

export const getUsers = gql`
query getUsers{
  getUsers{
    id
    name
    email
    realName
    phone
    desc
    role
    avatarUrl
    createdAt
    updatedAt
    wxUserId
  }
}
`

export const getWxUsers = gql`
query getWxUsers($take: Int,$skip: Int){
  getWxUsers(take: $take , skip: $skip){
    id
    name
    avatarUrl
    openId
    lastOperateDate
    lastPayDate
    createdAt
    updatedAt
  }
}
`
export const getWxUsersAndCount = gql`
query getWxUsersAndCount($take: Int,$skip: Int,$name: String){
  getWxUsersAndCount(take: $take , skip: $skip , name: $name){
    totalCount
        data{
    id
    name
    avatarUrl
    openId
    lastOperateDate
    distributorId
    lastPayDate
    createdAt
    updatedAt
        }
  }
}
`
export const getWxUserScanDistributorRecordsAndCount = gql`
query getWxUserScanDistributorRecordsAndCount($take: Int,$skip: Int){
  getWxUserScanDistributorRecordsAndCount(take: $take , skip: $skip ){
    totalCount
        data{
        wxUser{
    id
    name
    avatarUrl
    openId
    lastOperateDate
    distributorId
    lastPayDate
    createdAt
    updatedAt
    }
        }
  }
}
`
export const getUserLawyers = gql`
query getUserLawyers($take: Int,$skip: Int){
  getUserLawyers(take: $take , skip: $skip ){
 
    id
    name
        
  }
}
`
export const createUser = gql`
  mutation createUser($user: UserCreateInput!) {
    createUser(user: $user){
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
`;

export const updateUserInfoByAdmin = gql`
  mutation updateUserInfoByAdmin($user: AdminUserUpdateInput!,$userId: String!) {
    updateUserInfoByAdmin(user: $user,userId: $userId){
      id
      name
      email
      phone
      role
      avatarUrl
      createdAt
      updatedAt
      wxUserId
    }
  }
`;
export const updateCommodityLawyers = gql`
  mutation updateCommodityLawyers($lawyerIds: [String!]!,$id: Int!) {
    updateCommodityLawyers(lawyerIds: $lawyerIds,id: $id){
      id
      name
    }
  }
`;
export const updateUserInfo = gql`
  mutation updateUserInfo($user: UserUpdateInput!) {
    updateUserInfo(user: $user){
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
`;

export const deleteUser = gql`
  mutation deleteUser($userId: String!) {
    deleteUser(userId: $userId)
  }
`;