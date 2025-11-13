<template>
  <div class="min-h-screen my-register-container sm:pt-12">
    <!-- <j-helmet title="ORT"
              :close="false" /> -->
    <div :class="[
        'relative px-8 h-auto pt-10 pb-8 bg-white shadow-xl ring-1 ring-gray-900/5 sm:max-w-lg sm:mx-auto sm:rounded-lg sm:px-10',
        isMobile ? 'min-h-screen' : '',
      ]">
      <div class="mx-auto">
        <div class="divide-y divide-gray-300/50">
          <!-- <div class="register-word flex items-center">

            <span>{{ $t('register.SuperiorName') }}:{{ SuperiorName }}</span>
          </div> -->
          <div class="pt-8">

            <q-form class="q-gutter-md">
              <div>
                <q-input bottom-slots
                         v-model="distributorName"
                         :label="$t('register.DistributorName')"
                         label-color="teal-10">
                  <template v-slot:append>
                    <q-icon name="close"
                            @click="distributorName = ''"
                            class="cursor-pointer" />
                  </template>
                </q-input>
              </div>
              <div>
                <q-input bottom-slots
                         v-model="desc"
                         :label="$t('register.des')"
                         label-color="teal-10">
                  <template v-slot:append>
                    <q-icon name="close"
                            @click="desc = ''"
                            class="cursor-pointer" />
                  </template>
                </q-input>
              </div>
              <div>
                <q-input bottom-slots
                         v-model="userName"
                         :label="$t('register.username')"
                         label-color="teal-10">
                  <template v-slot:append>
                    <q-icon name="close"
                            @click="userName = ''"
                            class="cursor-pointer" />
                  </template>
                </q-input>
              </div>
              <div>
                <q-input bottom-slots
                         v-model="emailAddress"
                         :label="$t('register.email')"
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
                         v-model="mobilePhone"
                         :label="$t('register.phoneNumber')"
                         label-color="teal-10"
                         type="number">
                  <template v-slot:append>
                    <q-icon name="close"
                            @click="mobilePhone = ''"
                            class="cursor-pointer" />
                  </template>
                </q-input>
              </div>
              <div>
                <q-input bottom-slots
                         v-model="password"
                         :type="isPwd ? 'password' : 'text'"
                         :label="$t('register.password')"
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
                   :label="$t('register.register')"
                   style="background: #2793ff"
                   no-caps
                   @click="handleVerifyEmail" />
          </div>
        </div>
      </div>
      <q-inner-loading :showing="loadingShow">
        <q-spinner-bars size="50px"
                        color="#64243B" />
      </q-inner-loading>
      <q-dialog v-model="showVerifyEmailDialog"
                persistent>
        <q-card style="min-width: 350px">
          <q-card-section>
            <div class="text-h6">Verify</div>
          </q-card-section>
          <q-card-section class="pt-0">
            <div>
              Check your email: we sent you a verification code. Enter it here
              to verify you' re really you.
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-input dense
                     v-model.trim="emailCode"
                     autofocus
                     outlined />
          </q-card-section>

          <q-card-actions align="right"
                          class="text-primary">
            <div class="float-left flex-1 pl-1"
                 @click="ResendEmailCode">
              Don't see an email? Resend it.
            </div>
            <q-btn flat
                   label="Cancel"
                   no-caps
                   v-close-popup />
            <q-btn flat
                   label="Ok"
                   @click="registerUser"
                   no-caps />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api'
import validator from 'src/utils/validator'
import {
  register,
  sendEmailVerification,
  confirmCode,
} from 'src/graphql/queries/login'
import {
  registerUserAsDistributor,
  getOrgDistributorByUuid,
} from 'src/graphql/queries/distributor'
import { useMutation } from '@vue/apollo-composable'
import notify from '../boot/notify'
import { Dialog } from 'quasar'
import Vue from 'vue'
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from 'src/utils/isMobileBrowser'
export default defineComponent({
  name: 'Register',
  data() {
    return {
      isPwd: true,
      isMobile: getIsMobileBrowser(),
    }
  },
  mounted() {
    watchIsMobileBrowser(this, 'isMobile')
  },
  setup(props, { root }: { root: Vue }) {
    const emailAddress = ref<string>('')
    const password = ref<string>('')
    const desc = ref<string>('')
    const SuperiorName = ref<string>('')
    const mobilePhone = ref<string>('')
    const distributorName = ref<string>('')
    const userName = ref<string>('')
    const loadingShow = ref<boolean>(false)
    const { mutate: newRegister } = useMutation(register)
    const { mutate: registerUserAsDistributorMutation } = useMutation(
      registerUserAsDistributor
    )
    const { mutate: getOrgDistributorByUuidMutation } = useMutation(
      getOrgDistributorByUuid
    )
    const { uuid } = root.$route.params
    const { mutate: newSendEmailVerification } = useMutation(
      sendEmailVerification
    )
    const { mutate: newConfirmCode } = useMutation(confirmCode)
    const showVerifyEmailDialog = ref<boolean>(false)
    const emailCode = ref<string>('')
    const getDistributor = async () => {
      const res = await getOrgDistributorByUuidMutation({
        uuid: uuid,
      } as never)
      if (res) {
        SuperiorName.value = res.data.getOrgDistributorByUuid.name
      }
    }
    const handleVerifyEmail = async () => {
      try {
        if (!distributorName.value) {
          return notify.error(root.$t('register.DistributorNameRequire'))
        }
        if (!userName.value) {
          return notify.error(root.$t('register.invaildName'))
        }
        if (!validator.isEmail(emailAddress.value)) {
          return notify.error(root.$t('register.emailRequire'))
        }
        if (!validator.isMobile(mobilePhone.value)) {
          return notify.error(root.$t('register.PhoneRequire'))
        }
        if (!password.value) {
          return notify.error(root.$t('register.EnterNewPassword'))
        }
        let user = {
          name: userName.value,
          email: emailAddress.value,
          phone: mobilePhone.value,
          password: password.value,
          desc: desc.value,
          avatarUrl: 'https://file.sflow.pro/avatar_default.png',
        }
        const res = await registerUserAsDistributorMutation({
          distributorName: distributorName.value,
          uuid: uuid,
          user: user,
        } as any)
        if (res) {
          notify.success(root.$t('register.registerSuccess'))
        }
        // await newSendEmailVerification({ email: emailAddress.value } as any)
        //showVerifyEmailDialog.value = true
      } catch (error) {
        notify.error(error.message)
      }
    }
    const registerDistributor = async () => {
      const res = await registerUserAsDistributorMutation({
        distributorName: distributorName,
      } as any)
    }
    onMounted(() => {
      getDistributor()
    })
    const registerUser = async () => {
      try {
        loadingShow.value = true
        const user = {
          email: emailAddress.value,
          password: password.value,
          name: userName.value,
          mobilephone: mobilePhone.value,
          projectId: 1,
          userType: 1,
          desc: desc.value,
        }
        await newConfirmCode({
          email: emailAddress.value,
          code: emailCode.value,
        } as any)
        showVerifyEmailDialog.value = false
        await newRegister({ user } as any)
        notify.success('Registration is complete')
        setTimeout(() => {
          loadingShow.value = false
          void root.$router.replace('/login')
        }, 500)
      } catch (error) {
        notify.error(error.message)
        loadingShow.value = false
      }
    }
    const ResendEmailCode = async () => {
      try {
        await newSendEmailVerification({ email: emailAddress.value } as any)
        notify.success('Sent successfully')
      } catch (error) {
        notify.error(error.message)
      }
    }

    return {
      registerUser,
      handleVerifyEmail,
      ResendEmailCode,
      password,
      distributorName,
      emailAddress,
      mobilePhone,
      userName,
      loadingShow,
      desc,
      showVerifyEmailDialog,
      emailCode,
      SuperiorName,
    }
  },
  methods: {
    goBack() {
      void this.$router.replace('/login')
    },
  },
})
</script>

<style scoped>
.my-register-container {
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
.my-other-login-methods {
  margin-top: 20px;
  line-height: 30px;
}
.my-divider {
  border-top: 1px solid #cfcfcf;
  background-position: left 1em top 50%;
  flex: 1;
  margin: 0 6px;
  position: relative;
  top: 15px;
}
.register-word {
  height: 33px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #666666;
  line-height: 48px;
  position: relative;
  left: -1rem;
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
</style>
