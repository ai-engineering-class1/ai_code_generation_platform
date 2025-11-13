import gql from 'graphql-tag'




export const getOrgLlmTrace = gql`
query getOrgLlmTrace($take: Int!,$skip: Int!)  {
    getOrgLlmTrace(take: $take,skip: $skip) { 
        totalCount
        data{
            id
                    evaluate
            feedback
            solved
openid
taskid
project
wxUser{
name
avatarUrl
}
element
model
projectId
temperature
top_p
max_tokens
messages
response
prompt_tokens
completion_tokens
total_tokens
time_tx
time_rx
action
organizationId
createdAt
updatedAt
kb_prompt
kb_id
}
    } 
}
`
export const getLlmTraceElement = gql`
query getLlmTraceElement($outtradeno: String!)  {
    getLlmTraceElement(outtradeno: $outtradeno) 
    
}
`
export const updateLlmTrace = gql`
mutation updateLlmTrace ($id: Int!,$llmTrace: LlmTraceUpdateInput!)  {
    updateLlmTrace(id: $id,llmTrace: $llmTrace){
        id
    }
  }
`
export const getLlmTrace = gql`
query getLlmTrace($take: Int!,$skip: Int!,$outtradeno: String!,$id: Int,$solved: Int,$evaluate: Int,$serviceAction: Int,$project: String,$element: String)  {
    getLlmTrace(take: $take,skip: $skip,outtradeno: $outtradeno,id: $id,solved: $solved,evaluate: $evaluate,serviceAction: $serviceAction,project: $project,element: $element) { 
        totalCount
        data{
            id
            evaluate
            feedback
            solved
openid
taskid
project
element
model
wxUser{
name
avatarUrl
}
temperature
projectId
top_p
max_tokens
messages
response
prompt_tokens
completion_tokens
total_tokens
time_tx
action
time_rx
organizationId
createdAt
updatedAt
kb_prompt
kb_id
}
    } 
}
`
export const debugChatZhiPuKbByLlmTraceId = gql`
mutation debugChatZhiPuKbByLlmTraceId($top_p: Float!, $temperature: Float!, $messages: String!, $id: Int!,$kb_id: String,$kb_prompt: String,$model: String!) {
  debugChatZhiPuKbByLlmTraceId(top_p: $top_p, temperature: $temperature, messages: $messages, id: $id, kb_id: $kb_id, kb_prompt: $kb_prompt, model: $model)
}
`


