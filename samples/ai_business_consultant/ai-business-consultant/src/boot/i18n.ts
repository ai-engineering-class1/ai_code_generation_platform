import Vue from 'vue';
import { boot } from 'quasar/wrappers'
import Vuei18n from 'vue-i18n'
import ElementUI from "element-ui";
import enUS from '../i18n/en-us';
import zhCN from '../i18n/zh-cn';
import Arabic from '../i18n/ar';
import German from '../i18n/de';
import Spanish from '../i18n/es';
import French from '../i18n/fr';
import Hindi from '../i18n/hi';
import Italian from '../i18n/it';
import Switzerland from '../i18n/iw'
import Japan from '../i18n/ja'
import Korean from '../i18n/ko'
import Latin from '../i18n/la'
import Lithuanian from '../i18n/lt'
import Netherlands from '../i18n/nl'
import Portuguese from '../i18n/pt'
import Russian from '../i18n/ru'
import Somail from '../i18n/so'
import Swedish from '../i18n/sv'
import Turkish from '../i18n/tr'
import Vietnamese from '../i18n/vi'
import ZhTW from '../i18n/zh-tw'
import enLocale from "element-ui/lib/locale/lang/en";
import zhLocale from "element-ui/lib/locale/lang/zh-CN";
import jaLocale from 'element-ui/lib/locale/lang/ja'
import zhTwLocale from 'element-ui/lib/locale/lang/zh-TW'
import KoLocale from 'element-ui/lib/locale/lang/ko'
import frLocale from 'element-ui/lib/locale/lang/fr'
import deLocale from 'element-ui/lib/locale/lang/de'
import esLocale from 'element-ui/lib/locale/lang/es'
import itLocale from 'element-ui/lib/locale/lang/it'
import ptLocale from 'element-ui/lib/locale/lang/pt'
import nlLocale from 'element-ui/lib/locale/lang/nl'
import ruLocale from 'element-ui/lib/locale/lang/ru-RU'
import svLocale from 'element-ui/lib/locale/lang/sv-SE'
import viLocale from 'element-ui/lib/locale/lang/vi'
import ltLocale from 'element-ui/lib/locale/lang/lt'
import arLocale from 'element-ui/lib/locale/lang/ar'
import hiLocal from 'element-ui/lib/locale/lang/id'




const messages = {
  'en-us': enUS,
  'zh-cn': zhCN,
  'AR': Arabic,
  'DE': German,
  'ES': Spanish,
  'FR': French,
  'HI': Hindi,
  'IT': Italian,
  'IW': Switzerland,
  'JA': Japan,
  'KO': Korean,
  'LA': Latin,
  'LT': Lithuanian,
  'NL': Netherlands,
  'PT': Portuguese,
  'RU': Russian,
  'SO': Somail,
  'SV': Swedish,
  'TR': Turkish,
  'VI': Vietnamese,
  'zh-TW': ZhTW,
};

const locales: any = {
  'en-us': enLocale,
  'zh-cn': zhLocale,
  'JA': jaLocale,
  'ES': esLocale,
  'FR': frLocale,
  'IT': itLocale,
  'PT': ptLocale,
  'DE': deLocale,
  'KO': KoLocale,
  'zh-TW': zhTwLocale,
  'LA': enLocale,
  'NL': nlLocale,
  'RU': ruLocale,
  'SV': svLocale,
  'VI': viLocale,
  'LT': ltLocale,
  'AR': arLocale,
  'HI': hiLocal,
  'IW': deLocale,
}




Vue.use(Vuei18n);

const isZh: any = sessionStorage.getItem('language') == null ? 'zh-cn' : sessionStorage.getItem('language')
// const currentLocale = locales[isZh] || zhLocale; // 默认使用中文
Vue.use(ElementUI, { locale: isZh == null ? zhLocale : locales[isZh] });
const i18n = new Vuei18n({
  locale: isZh,
  messages,
  silentTranslationWarn: true,
})

export default (({ app }) => {
  // const isZh = window.origin.includes('sflow.pro') ? true : false


  app.i18n = i18n
})

export { i18n };
