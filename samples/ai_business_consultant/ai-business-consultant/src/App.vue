<template>
  <div id="q-app">
    <router-view />
    <Modals />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { DefaultApolloClient } from '@vue/apollo-composable';
import { apolloClient } from 'src/graphql/client';
import { provide } from '@vue/composition-api';
import Modals from 'src/components/Modals/Modals.vue';

export default defineComponent({
  name: 'App',
  components: {
    Modals,
  },
  setup() {
    provide(DefaultApolloClient, apolloClient);
  },
});
</script>
