import gql from 'graphql-tag'

export const register = gql`
mutation register($user: RegisterInput!) {
    register(user: $user) {
        name
        email
        password
        projectId
        userType
    }
  }
`

export const login = gql`
mutation login($user: UserLoginInput!) {
  login(user: $user)
  }
`
export const thirdLogin = gql`
mutation thirdLogin($token: String!) {
  thirdLogin(token: $token)
}
`
export const sendEmailVerification = gql`
mutation sendEmailVerification($email: String!) {
  sendEmailVerification(email: $email)
}
`
export const confirmCode = gql`
mutation confirmCode($code: String!, $email: String!) {
  confirmCode(code: $code, email: $email)
}
`
export const logoutTrack = gql`
mutation logoutTrack {
    logoutTrack
  }
`