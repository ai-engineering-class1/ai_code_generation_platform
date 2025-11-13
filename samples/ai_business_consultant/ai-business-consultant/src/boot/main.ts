import Vue from 'vue'
import { boot } from 'quasar/wrappers';
import FBSignInButton from 'vue-facebook-signin-button'
import { registerSharedComponents } from '../plugins/register';
import { registerVantComponents } from '../plugins/vantRegister';
import { registerElementUIComponents } from '../plugins/elementUIRegister';
import { loadSprites } from '../plugins/loadSvg';
import "../assets/iconfont.css";
import "../pages/pipeline/style/index.less";
import JsonViewer from 'vue-json-viewer'
// 定义格式化毫秒为日期时间的过滤器
Vue.filter('formatDateTime', function (value) {
    if (!value) return '';
    const date = new Date(value * 1000);
    return (
        date.getFullYear() + '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
        ('0' + date.getDate()).slice(-2) + ' ' +
        ('0' + date.getHours()).slice(-2) + ':' +
        ('0' + date.getMinutes()).slice(-2) + ':' +
        ('0' + date.getSeconds()).slice(-2)
    );
});
Vue.use(FBSignInButton)
Vue.use(JsonViewer)
export default boot(() => {
    loadSprites();
    registerSharedComponents();
    registerVantComponents()
    registerElementUIComponents()

});
