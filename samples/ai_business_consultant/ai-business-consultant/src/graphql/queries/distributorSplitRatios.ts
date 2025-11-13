import gql from 'graphql-tag'

export const getOrgDistributorSplitRatios = gql`
query getOrgDistributorSplitRatios{
  getOrgDistributorSplitRatios{
    id
    name
    ratioJson
  }
}
`


export const createDistributorSplitRatio = gql`
  mutation createDistributorSplitRatio($distributorSplitRatio: DistributorSplitRatioInput!) {
    createDistributorSplitRatio(distributorSplitRatio: $distributorSplitRatio){
      id
      name

    }
  }
`;

export const updateDistributorSplitRatio = gql`
  mutation updateDistributorSplitRatio($distributorSplitRatio: DistributorSplitRatioInput!,$id: Int!) {
    updateDistributorSplitRatio(distributorSplitRatio: $distributorSplitRatio,id: $id){
      id
      name
    }
  }
`;

export const deleteDistributorSplitRatio = gql`
  mutation deleteDistributorSplitRatio($id: Int!) {
    deleteDistributorSplitRatio(id: $id)
  }
`;