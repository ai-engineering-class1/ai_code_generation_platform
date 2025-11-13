import { route } from 'quasar/wrappers';
import VueRouter from 'vue-router';
import { Store } from 'vuex';
import { StateInterface } from '../store';
import routes from './routes';
import store from '../store/store'
import { fetchMe } from '../graphql/queries/auth'


/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation
 */

export default route<Store<StateInterface>>(function ({ Vue }) {
    Vue.use(VueRouter);
    const Router = new VueRouter({
        scrollBehavior: () => ({ x: 0, y: 0 }),
        routes,

        // Leave these as is and change from quasar.conf.js instead!
        // quasar.conf.js -> build -> vueRouterMode
        // quasar.conf.js -> build -> publicPath
        mode: process.env.VUE_ROUTER_MODE,
        base: process.env.VUE_ROUTER_BASE
    });

    Router.beforeEach(async (to, _, next) => {
        if (to.query.userAgent) {
            if (to.query.userAgent === 'mobile') {
                window.__isMobile = true
                window.__isIframe = true
            }
        }
        if (to.query.o && to.query.o !== 'undefined') {
            window.__externalHost = to.query.o
        }
        if (to.matched.some(routeRecord => routeRecord.meta.requiresAuth)) {
            if (!store.getters.isAuthenticated()) {
                next({ name: 'login' })
            } else {
                try {

                    const currentUser = await fetchMe()
                    store.mutations.setCurrentUser(currentUser)
                    store.mutations.setEasiioId(currentUser.easiioId)
                    store.mutations.setOrg(currentUser.organization)
                    store.mutations.setIsAuthenticated(true)
                    next()
                } catch (error) {
                    store.mutations.setIsAuthenticated(false)
                    next({ name: 'login' })
                }
            }
        } else {
            next()
        }
    })


    return Router;
})
