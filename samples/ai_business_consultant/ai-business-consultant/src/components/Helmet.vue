<template>
<div v-if="!isIframe">
  <div class="my-helmet flex justify-center items-center">
    <div class="my-helemet-word">{{title}}</div>
    <q-icon v-if="close" class="my-helmet-close" name="close" color="white" size="sm" @click="onclose"/>
  </div>
  <div style="height:50px"></div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
export default defineComponent({
    methods: {
       onclose(){
       this.$router.replace('/login');
       }
    },
  name: 'j-helmet',
  props: {
    title: {
      type: String,
      default: '',
    },
    close: {
      type: Boolean,
      default: true,
    },
  },
  data(){
    return {
      isIframe: window.__isIframe || false
    }
  }
});
</script>
<style lang="scss" scoped>
.my-helmet {
  background-image: url("../assets/img/helmet.png");
  background-position: center;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  height: 50px;
  width: 100%;
  position: fixed;
  background-color: white;
  z-index: 999;
  top: 0;
  left: 0;
  .my-helemet-word {
    font-size: 18px;
    font-family: PingFang SC;
    font-weight: 500;
    color: #ffffff;
    line-height: 8px;
  }
  .my-helmet-close{
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
  }
}
</style>
