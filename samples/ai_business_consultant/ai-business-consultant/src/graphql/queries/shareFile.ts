import gql from "graphql-tag";
import { apolloClient } from "../client";
//import OSSConfig from '@/types/ossConfig'

export const getShareFileMapping = gql`
  mutation getShareFileMapping($shareUUID: String!) {
    getShareFileMapping(shareUUID: $shareUUID)
  }
`;

export const createShareFileMapping = gql`
  mutation createShareFileMapping(
    $shareTime: Int!
    $type: String!
    $projectId: Int!
    $emails: [String!]!
    $netdiskId: Int!
  ) {
    createShareFileMapping(
      shareTime: $shareTime
      type: $type
      projectId: $projectId
      emails: $emails
      netdiskId: $netdiskId
    )
  }
`;

export const getTemporaryAliOSSConfig = gql`
  query getTemporaryAliOSSConfig {
    getTemporaryAliOSSConfig
  }
`;

export const getTemporaryOSSConfig = gql`
  query getTemporaryOSSConfig($vendor: String!) {
    getTemporaryOSSConfig(vendor: $vendor)
  }
`;

export const getOSSConfig = async (vendor): Promise<any> => {
  try {
    const res = await apolloClient.query<{ getTemporaryOSSConfig: any }>({
      query: getTemporaryOSSConfig,
      variables: { vendor: vendor },
      fetchPolicy: "no-cache",
    });
    return Promise.resolve(res.data.getTemporaryOSSConfig);
  } catch (error) {
    return Promise.reject(error);
  }
};

// export const getOSSConfig = async (): Promise<OSSConfig> => {
//   try {
//     const res = await apolloClient.query<{ getTemporaryAliOSSConfig: OSSConfig }>({
//       query: getTemporaryAliOSSConfig,
//       fetchPolicy: 'no-cache',
//     })
//     return Promise.resolve(res.data.getTemporaryAliOSSConfig)
//   } catch (error) {
//     return Promise.reject(error)
//   }
// }
