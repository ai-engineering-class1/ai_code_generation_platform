import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import { getStoredAuthToken } from 'src/utils/authToken';

const httpLink = createHttpLink({
    uri:
        'https://abc.easiio.com/graphql',
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
