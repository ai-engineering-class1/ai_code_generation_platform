<template>
  <div class="q-pa-md container">
    <div class="my-8"
         style="height: 1.875rem"></div>
    <img @click="goOff()"
         class="mr-1 mt-2 ml-4"
         style="float: left; width: 22px"
         src="../assets/img/return.png" />
    <div class="text-3xl">{{ $t('profile.profile') }}</div>
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <q-img class="imgbox"
             :style="{ width: '100px', height: '100px', border: '1px  solid grey' }"
             :src="currentUser.avatarUrl" />
      <el-upload class="upload-demo "
                 action=""
                 ref="uploadRef"
                 :http-request="beforeupload"
                 :show-file-list="false"
                 accept="image/jpg,image/jpeg,image/png">
        <el-button type="primary">{{ $t('profile.selectimage') }}</el-button>
      </el-upload>
      <el-form ref="form"
               class="w-full"
               label-position="top"
               :model="form"
               label-width="200px">
        <el-form-item :label="$t('profile.username')">
          <el-input v-model="userInfo.username"></el-input>
        </el-form-item>
        <el-form-item :label="$t('profile.Phone')">
          <el-input v-model="userInfo.phone"></el-input>
        </el-form-item>
        <el-form-item :label="$t('profile.Email')">
          <el-input v-model="userInfo.email"></el-input>
        </el-form-item>
        <el-form-item :label="$t('profile.realName')">
          <el-input v-model="userInfo.realName"></el-input>
        </el-form-item>
        <el-form-item class="mt-10">
          <el-button type="primary"
                     @click="handleSave">{{ $t('profile.Save') }}</el-button>
          <el-button @click="handleReset">{{ $t('profile.resetPassword') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-dialog :title=" $t('profile.resetPassword')"
               width="30%"
               :close-on-click-modal="false"
               :visible.sync="dialogFormVisible">
      <el-form :model="form">

        <el-form-item :label="$t('profile.Originalpassword')">
          <el-input v-model="userInfo.oldPws"
                    autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t('profile.Newpassword')">
          <el-input v-model="userInfo.newPwd"
                    autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t('profile.confirmpassword')">
          <el-input v-model="userInfo.confirmPwd"
                    autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{$t('profile.Cancel')}}</el-button>
        <el-button type="primary"
                   @click="handleSubmitReset">{{$t('profile.Confirm')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  defineComponent,
  ref,
  onMounted,
  computed,
  reactive,
} from '@vue/composition-api'
import validator from 'src/utils/validator'
import { useMutation } from '@vue/apollo-composable'
import { updateUserInfo, updateUserPassword } from 'src/graphql/queries/profile'
import { storeAuthToken } from 'src/utils/authToken'
import notify from 'src/boot/notify'
import store from 'src/store/store'
import { uploadOSS, OSSConfig } from 'src/boot/oss'
import { getters, mutations } from '../store/store'
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
      form: {
        name: '',
        region: '',
        date1: '',
        date2: '',
        delivery: false,
        type: [],
        resource: '',
        desc: '',
      },
    }
  },
  mounted() {
    watchIsMobileBrowser(this, 'isMobile')
  },
  setup(props, { root }) {
    const currentUser = computed(getters.currentUser)
    const goOff = () => {
      void root.$router.push('/people')
    }
    const { mutate: updateUserInfoMutate } = useMutation(updateUserInfo)
    const { mutate: updateUserPasswordMutate } = useMutation(updateUserPassword)
    const userInfo = reactive({
      oldPws: '',
      newPwd: '',
      confirmPwd: '',
      avatarUrl: currentUser.value.avatarUrl,
      username: currentUser.value.name,
      email: currentUser.value.email,
      phone: currentUser.value.phone,
      realName: currentUser.value.realName,
    })
    const beforeupload = async (file) => {
      const result = await uploadOSS(file.file)
      currentUser.value.avatarUrl = result.fileUrl
      userInfo.avatarUrl = result.fileUrl
      return result.fileUrl
    }

    const handleSubmitReset = async () => {
      const { newPwd, confirmPwd } = userInfo
      if (!newPwd) {
        return notify.error(root.$t('profile.Newpasswordisrequired'))
      }
      if (!confirmPwd) {
        return notify.error(root.$t('profile.Confirmpasswordisrequired'))
      }
      if (newPwd !== confirmPwd) {
        return notify.error(root.$t('profile.Thetwoinputsneedtobeconsistent'))
      }

      try {
        const res = await updateUserPasswordMutate({
          newPassword: userInfo.newPwd,
          password: userInfo.oldPws,
        })
        if (res) {
          notify.success(root.$t('notify.Done'))
        }
      } catch (error) {
        notify.error(error.message)
      }
    }
    const handleSave = async () => {
      if (!validator.isEmail(userInfo.email)) {
        return notify.error(root.$t('profile.emailRequire'))
      }
      if (!validator.isMobile(userInfo.phone)) {
        return notify.error(root.$t('profile.PhoneRequire'))
      }
      if (userInfo.username == '') {
        return notify.error(root.$t('profile.invaildName'))
      }
      const user = {
        name: userInfo.username,
        phone: userInfo.phone,
        email: userInfo.email,
        avatarUrl: userInfo.avatarUrl,
        realName: userInfo.realName,
      }
      const res = await updateUserInfoMutate({ user: user })
      if (res) {
        notify.success(root.$t('notify.Done'))
      }
    }
    const handleReset = () => {
      dialogFormVisible.value = true
    }
    const dialogFormVisible = ref(false)

    onMounted(() => {})
    return {
      currentUser,
      handleSave,
      beforeupload,
      userInfo,
      handleReset,
      dialogFormVisible,
      handleSubmitReset,
      goOff,
    }
  },
})
</script>
<style scoped>
@media (min-width: 1024px) {
  .container {
    margin: auto;
    width: 50%;
  }
  .imgbox {
    border-radius: 100px;
    margin-bottom: 10px;
  }
}
@media screen and (max-width: 760px) {
  .imgbox {
    border-radius: 100px;
    margin-left: 50px;
  }
  .selectbtn {
    margin-left: 90px;
  }
}

.savebtn {
  margin-left: 1rem;
}
.radio-input {
  display: none;
}
.radio-target {
  @apply w-8 h-8 rounded-lg relative cursor-pointer inline-block;
}
.radio-target:hover {
  box-shadow: 0px 0px 0px 2px #a5adba;
}
.radio-target:hover::before {
  display: inline-block;
}

.radio-target::before {
  content: attr(data-text);
  position: absolute;
  display: none;
  padding: 5px;
  top: 120%;
  left: 50%;
  transform: translate(-50%);
  background: #000;
  color: #fff;
  white-space: nowrap;
  text-align: center;
  border-radius: 4px;
  line-height: 1;
}
.radio-input:checked + .radio-target::after {
  display: block;
}
::v-deep .el-form-item {
  margin-bottom: 0;
}
</style>

