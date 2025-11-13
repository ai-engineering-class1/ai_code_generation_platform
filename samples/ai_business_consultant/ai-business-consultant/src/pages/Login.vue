<template>
  <div class="min-h-screen my-login-container sm:pt-12">

    <div :class="[
        'relative px-8 h-auto pt-10 pb-8 bg-white shadow-xl ring-1 ring-gray-900/5 sm:max-w-lg sm:mx-auto sm:rounded-lg sm:px-10',
        isMobile ? 'min-h-screen' : '',
      ]">
      <div class="mx-auto">
        <div class="divide-y divide-gray-300/50">
          <div class="login-word mt-3 full-width bg-blue-500 font-bold rounded-lg">
            {{ $t('login.Login') }}
          </div>
          <div class="pt-8">
            <q-form class="q-gutter-md">
              <div>
                <q-input bottom-slots
                         v-model="emailAddress"
                         :label="$t('login.Account')"
                         label-color="teal-10">
                  <template v-slot:append>
                    <q-icon name="close"
                            @click="emailAddress = ''"
                            class="cursor-pointer" />
                  </template>
                </q-input>
              </div>

              <div>
                <q-input bottom-slots
                         v-model="password"
                         :type="isPwd ? 'password' : 'text'"
                         :label="$t('login.Password')"
                         label-color="teal-10">
                  <template v-slot:append>
                    <q-icon :name="isPwd ? 'visibility_off' : 'visibility'"
                            class="cursor-pointer"
                            @click="isPwd = !isPwd" />
                    <q-icon name="close"
                            @click="password = ''"
                            class="cursor-pointer" />
                  </template>
                </q-input>
              </div>
            </q-form>
            <q-btn flat
                   size="lg"
                   class="mt-3 full-width font-bold text-white"
                   :label="$t('login.Login')"
                   style="background: #2793ff"
                   no-caps
                   @click="submit" />
          </div>
        </div>

      </div>
      <q-inner-loading :showing="loadingShow">
        <q-spinner-bars size="50px"
                        color="#64243B" />
      </q-inner-loading>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from '@vue/composition-api'
import validator from 'src/utils/validator'
import { useMutation } from '@vue/apollo-composable'
import { login } from 'src/graphql/queries/login'
import { storeAuthToken } from 'src/utils/authToken'
import notify from 'src/boot/notify'
import store from 'src/store/store'
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from 'src/utils/isMobileBrowser'
export default defineComponent({
  name: 'Login',
  data() {
    return {
      isPwd: true,
      fbSignInParams: {
        scope: 'email,user_likes',
        return_scopes: true,
      },
      isNetWrok: true,
      isMobile: getIsMobileBrowser(),
    }
  },
  mounted() {
    watchIsMobileBrowser(this, 'isMobile')
  },
  setup(props, { root }) {
    const emailAddress = ref('')
    const password = ref('')
    const loadingShow = ref(false)
    const { mutate: newLogin } = useMutation(login)
    const submit = async () => {
      if (!emailAddress.value) {
        return notify.error(root.$t('login.Account'))
      }
      if (!password.value) {
        return notify.error(root.$t('login.Password'))
      }
      try {
        loadingShow.value = true
        const user = {
          email: emailAddress.value,
          password: password.value,
        }
        const loginRes = await newLogin({ user })
        if (loginRes.data) {
          notify.success(root.$t('login.Loginsuccessful'))
          storeAuthToken(loginRes.data.login)
          setTimeout(() => {
            window.location = '/#/'
          }, 500)
        }
      } catch (error) {
        notify.error(root.$t('login.LoginFail'))
      }
      loadingShow.value = false
    }

    onMounted(() => {})
    return {
      emailAddress,
      password,
      loadingShow,
      submit,
    }
  },
  methods: {
    goRegsiter() {
      void this.$router.push('/register')
    },
    handleNetwork() {
      if (!this.isNetWrok) {
        notify.error('Poor network connection.')
      }
    },
  },
  created() {},
})
</script>

<style scoped>
.my-login-container {
  /* font-family: Poppins; */
  background-color: #f1f5f9;
  font-family: 'Inter var', ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans',
    sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji' !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
  letter-spacing: 0.05em !important;
  color: #1e293b;
}
.my-divider {
  border-top: 1px solid #cfcfcf;
  background-position: left 1em top 50%;
  flex: 1;
  margin: 0 6px;
  position: relative;
  top: 15px;
}
.login-word {
  height: 33px;
  font-size: 32px;
  font-weight: 600;
  color: #666666;
  line-height: 48px;
  font-family: 'CircularStd', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif, 'CircularStd';
}
.my-divider {
  border-top: 1px solid #cfcfcf;
  background-position: left 1em top 50%;
  flex: 1;
  margin: 0 6px;
  position: relative;
  top: 9px;
}
.g_id_signin1 {
  background-image: url('~assets/img/icon-google.png');
  background-size: 100% 100%;
  background-position: 0% 0%;
  background-repeat: no-repeat;
  width: 38px;
  height: 38px;
}
.g_id_signin1 >>> div[role='button'],
.g_id_signin1 >>> iframe {
  opacity: 0;
}
</style>
