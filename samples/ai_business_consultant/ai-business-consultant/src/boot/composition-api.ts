import VueCompositionApi from '@vue/composition-api';
import { boot } from 'quasar/wrappers';
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default boot(({ Vue }) => {
  Vue.use(VueCompositionApi);
});
