import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import { getStoredAuthToken } from 'src/utils/authToken';

// Use local GraphQL server for development, or remote for production
// You can override this by setting VUE_APP_GRAPHQL_URL environment variable
const GRAPHQL_URL = process.env.VUE_APP_GRAPHQL_URL || 'http://localhost:8050/graphql';

const httpLink = createHttpLink({
    uri: GRAPHQL_URL,
});
// eslint-disable
const authLink = setContext((_, { headers }) => {
    return {
        headers: {
            ...headers,
            Authorization: getStoredAuthToken()
                ? `Bearer ${getStoredAuthToken()}`
                : undefined,
        },
    };
});

const cache = new InMemoryCache();

export const apolloClient: ApolloClient<NormalizedCacheObject> =
    new ApolloClient({
        link: authLink.concat(httpLink),
        cache,
    });
