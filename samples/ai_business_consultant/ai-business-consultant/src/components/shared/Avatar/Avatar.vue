<template>
  <div :style="getImageStyle" v-if="avatarUrl" />
  <div v-else :style="getLetterStyle" class="letter">
    <span v-if="!empty">
      <slot />
    </span>
  </div>
</template>

<script lang="ts">
import { avatarColors } from 'src/utils/colors';
import { computed, defineComponent } from '@vue/composition-api';
export default defineComponent({
  name: 'j-avatar',
  props: {
    avatarUrl: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      default: 32,
    },
    rounded: {
      type: Boolean,
      default: true,
    },
    empty: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const getImageStyle = computed(() => ({
      display: 'inline-block',
      width: `${props.size}px`,
      height: `${props.size}px`,
      'border-radius': props.rounded ? '100%' : '3px',
      backgroundImage: `url('${props.avatarUrl}')`,
      backgroundPosition: '50% 50%',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
    }));

    const getColorFromName = computed(
      () =>
        avatarColors[
          props.name.toLocaleLowerCase().charCodeAt(0) % avatarColors.length
        ]
    );

    const getLetterStyle = computed(() => ({
      width: `${props.size}px`,
      height: `${props.size}px`,
      background: getColorFromName.value,
      fontSize: `${Math.round(props.size / 2)}px`,
    }));

    return {
      getImageStyle,
      getLetterStyle,
    };
  },
});
</script>

<style lang="scss" scoped>
.letter {
  @apply bg-primary inline-block rounded-sm uppercase text-white;
}
.letter > span {
  @apply flex items-center justify-center h-full;
}
</style>
