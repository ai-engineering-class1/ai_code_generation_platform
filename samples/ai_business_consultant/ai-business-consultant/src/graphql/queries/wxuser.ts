import gql from 'graphql-tag'


export const getWxUsers = gql`
query getWxUsers{
    getWxUsers {
        id
        name
    avatarUrl
    openId
    lastOperateDate
    lastPayDate
  }
}
`

