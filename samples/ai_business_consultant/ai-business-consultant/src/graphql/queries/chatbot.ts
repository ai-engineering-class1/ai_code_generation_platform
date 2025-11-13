import gql from 'graphql-tag'



export const updateSfbot = gql`
mutation updateSfbot ($id: Int!,$sfbot: SfbotUpdateInput!)  {
    updateSfbot(id: $id,sfbot: $sfbot){
        chatAiName
    }
  }
`

export const getSfbots = gql`
query getSfbots  {
    getSfbots  {
        id
        chatAiName
      chatAiGreeting
      model
      character_desc
      temperature
      top_p
      max_tokens
      kbId
      charDescLaw
      charDescQos
      charDescCki
      promptKbx
      promptQos
      promptCki
      promptAsk
      chatAiGreeting
      chatAiAvatarUrl
      chatAiPeroration
      rechargeReminder
  }
}
`

