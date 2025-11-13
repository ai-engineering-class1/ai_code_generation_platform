import gql from 'graphql-tag'



export const getWxPaidOrders = gql`
query getWxPaidOrders   {
    getWxPaidOrders {
                id
        out_trade_no
        total
        wxUserId
        success_time
        createdAt
        t1_share
        t2_share
        state
         commodity{
              name 
            }
        wxUser{
            name
           
            avatarUrl
             distributorId
            distributor{
              name 
              t1Distributor{
              name
              }
            }
        }
    } 
}
`

export const getWxPaidOrdersAndCount = gql`
query getWxPaidOrdersAndCount($take: Int!,$skip: Int!)   {
    getWxPaidOrdersAndCount(take: $take,skip: $skip) {
     totalCount
        data{
        id
        out_trade_no
        total
        wxUserId
        success_time
        createdAt
        t1_share
        t2_share
        state
         commodity{
              name 
            }
        wxUser{
            name
           
            avatarUrl
             distributorId
            distributor{
              name 
              t1Distributor{
              name
              }
            }
        }
}
    } 
}
`
export const getSelfWxPaidOrders = gql`
query getSelfWxPaidOrders($openid: String!)   {
    getSelfWxPaidOrders( openid: $openid) {
        id
        out_trade_no
        total
        wxUserId
        success_time
        state
        createdAt
    } 
}
`

