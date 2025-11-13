import gql from 'graphql-tag'

export const createComment = gql`
  mutation createComment($comment: CommentInput!) {
    createComment(comment: $comment) {
      id
      body
      issueId
      userId
      createdAt
      updatedAt
    }
  }
`
export const createAttachment = gql`
  mutation createAttachment($attachment: AttachmentInput!) {
    createAttachment(attachment: $attachment) {
      url
      name
      issueId
    }
  }
`

export const deleteAttachment = gql`
  mutation deleteAttachment($name: String!) {
    deleteAttachment(name: $name){
        name
        url
    }
  }
  `

export const deleteComment = gql`
  mutation deleteComment($commentId: String!) {
    deleteComment(id: $commentId)
  }
`
export const updateComment = gql`
  mutation updateComment($commentId: String!, $comment: CommentInput!) {
    updateComment(comment: $comment, id: $commentId) {
      body
    }
  }
`
