import gql from 'graphql-tag'

export const getOrgDistributors = gql`
query getOrgDistributors{
  getOrgDistributors{
    id
    name
    desc
    wxQrCode
    t2QrCode
    uuid
    createdAt
    t1DistributorId
    t1Distributor{
       id
    name
     desc
    wxQrCode
    t2QrCode
    uuid
    createdAt
     user{
    id
    name
    email
    phone
    }

        distributorSplitRatio{
    id
    name
    ratioJson
    }
       distributorSplitRatio2{
    id
    name
    ratioJson
    }
       distributorSplitRatio3{
    id
    name
    ratioJson
    }
    }
    distributorSplitRatioId
    distributorSplitRatio2Id
    distributorSplitRatio3Id
      user{
    id
    name
    email
    phone
    }
        distributorSplitRatio{
    id
    name
    ratioJson
    }
       distributorSplitRatio2{
    id
    name
    ratioJson
    }
       distributorSplitRatio3{
    id
    name
    ratioJson
    }
    t1Distributor{
    id
    name
    }
    t2Distributors{
    id
    name
     desc
    wxQrCode
    t2QrCode
    uuid
    createdAt
    t1DistributorId
     t1Distributor{
    id
    name
    }
    distributorSplitRatioId
     user{
    id
    name
    email
    phone
    }

    }
  }
}
`
export const getOrgDistributorCommissionStatistics = gql`
query getOrgDistributorCommissionStatistics($lastDate: Int!) {
  getOrgDistributorCommissionStatistics(lastDate: $lastDate)
}
`
export const getTwoMonthDistributorWithdrawFunds = gql`
query getTwoMonthDistributorWithdrawFunds {
  getTwoMonthDistributorWithdrawFunds
}
`
export const acceptedDistributorApplyWxIncomeTransfer = gql`
mutation acceptedDistributorApplyWxIncomeTransfer($id: Int!) {
  acceptedDistributorApplyWxIncomeTransfer(id: $id){
  id
  }
}
`
export const getWxPaidOrdersByDate = gql`
query getWxPaidOrdersByDate ($date: String!) {
    getWxPaidOrdersByDate(date: $date) {
        id
        out_trade_no
        total
        wxUserId
        success_time
        createdAt
        t1_share
        t2_share
        state
        wxUser{
            name
            avatarUrl
        }
    }
}
`
export const getDistributorWithdrawFundsAndCount = gql`
query getDistributorWithdrawFundsAndCount  ($take: Int,$skip: Int){
    getDistributorWithdrawFundsAndCount(take: $take,skip: $skip) {
    totalCount
    data{
    id
      amount
      batch_status
      createdAt
      approvedDate
      finishedDate
      notiyInfo
      t1WxPaidOrders{
      id
      out_trade_no
      wxUserId
      success_time
      state
      total
      wxUser{
      name
      avatarUrl
      }
      createdAt
      commodity{
       name
      }
       t1_share
       t2_share
      }
         t2WxPaidOrders{
      id
      out_trade_no
      wxUserId
      success_time
      state
      total
      createdAt
        wxUser{
      name
      avatarUrl
      }
      commodity{
       name
      }
       t1_share
       t2_share
      }
      distributor{
      name
      }
    }


  }
}
`
export const getOrgDistributorCommissionBalance = gql`
query getOrgDistributorCommissionBalance {
  getOrgDistributorCommissionBalance
}
`
export const getOrgDistributorByUuid = gql`
query getOrgDistributorByUuid($uuid: String!) {
  getOrgDistributorByUuid(uuid: $uuid){
    id
    name
  }
}
`
export const createDistributor = gql`
  mutation createDistributor($user: UserCreateAsDistributorInput!,$distributor: DistributorInput!) {
    createDistributor(user: $user,distributor: $distributor){
      id
      name

    }
  }
`;

export const distributorApplyWxIncomeTransfer = gql`
  mutation distributorApplyWxIncomeTransfer{
    distributorApplyWxIncomeTransfer{
    id
    }
  }
`;

export const registerUserAsDistributor = gql`
  mutation registerUserAsDistributor($distributorName: String!,$uuid: String!,$user: UserCreateAsDistributorInput!) {
    registerUserAsDistributor(distributorName: $distributorName,uuid: $uuid,user: $user){
      id
      name

    }
  }
`;

export const updateDistributor = gql`
  mutation updateDistributor($distributor: DistributorUpdateInput!,$id: Int!) {
    updateDistributor(distributor: $distributor,id: $id){
      id
      name
    }
  }
`;

export const deleteDistributor = gql`
  mutation deleteDistributor($id: Int!) {
    deleteDistributor(id: $id)
  }
`;



export const getSellDistributorCommoditys = gql`
query getSellDistributorCommoditys {
  getSellDistributorCommoditys{
    id
        name
        uuid
        qrCode
        validDays
        h5Link
        legalDocumentProjectId
        price
        availableQueries
        legalDocumentProject{
            id
            name
        }
        lawyers{
        id
        name
        }
        createdAt
        updatedAt
        mainImg
        description
        marketPrice
        details
        carouselImgs
        detailImgs
        status
        creatorId
        stock
        state
        organizationId
  }
}
`


export const getAllOrganizations = gql`
query getAllOrganizations {
  getAllOrganizations{
    id
    name
  }
}
`

export const getCommoditysFromDistributor = gql`
query getCommoditysFromDistributor($orgId: Int!)  {
  getCommoditysFromDistributor(orgId: $orgId) {
    id
    name
    mainImg
    legalDocumentProject{
      id
      name
    }
    status
    price
    description
    createdAt
    updatedAt
  }
}
`

export const distributorPurchaseCommodity = gql`
query distributorPurchaseCommodity($orgId: Int!,$stock: Int!,$commodityId: Int!) {
  distributorPurchaseCommodity(orgId: $orgId,stock: $stock,commodityId: $commodityId)
}
`
