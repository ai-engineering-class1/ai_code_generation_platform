<template>
  <q-item clickable
          :to="path"
          :active="isLinkActive(path)"
          active-class="active-class text-white"
          @click="onLinkClick"
          class="text-gray-400">
    <q-item-section v-if="icon"
                    avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>
        {{ caption }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'EssentialLink',
  props: {
    title: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
    },

    path: {
      type: String,
      default: '#',
    },

    icon: {
      type: String,
      default: '',
    },
  },
  setup(props, { root }) {
    const isLinkActive = (path) => {
      if (
        root.$route.path &&
        typeof root.$route.path === 'string' &&
        root.$route.path.indexOf('project/') !== -1 &&
        typeof path === 'string' &&
        path.indexOf('project/') !== -1
      ) {
        return true
      }
      if (
        root.$route.path &&
        typeof root.$route.path === 'string' &&
        root.$route.path.indexOf('map-view/') !== -1 &&
        typeof path === 'string' &&
        path.indexOf('map-view/') !== -1
      ) {
        return true
      }
      return path === root.$route.path
    }
    return {
      isLinkActive,
      onLinkClick() {
        // root.$router.push(props.path)
      },
    }
  },
})
</script>
<style scoped>
.active-class {
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 25px;
  margin-top: 10px;
  margin-bottom: 10px;
  margin-left: 3px;
  margin-right: 3px;
}
</style>