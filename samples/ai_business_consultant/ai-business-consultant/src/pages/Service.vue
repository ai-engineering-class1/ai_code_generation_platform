<template>
  <div class="q-pa-md container">

    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;"
         class="pb-8">

      <el-form class="w-full"
               label-position="top"
               label-width="200px">
        <el-form-item>
          <div class="row">
            <div class="column">
              <span>{{ $t('service.servicerAvatar') }}</span>
              <q-img class="imgbox"
                     :style="{ width: '100px', height: '100px', border: '1px  solid grey' }"
                     :src="userInfo.chatAiAvatarUrl" />
              <el-upload class="upload-demo "
                         :http-request="beforeupload"
                         action=""
                         :show-file-list="false"
                         accept="image/jpg,image/jpeg,image/png">
                <el-button type="primary">{{ $t('profile.selectimage') }}</el-button>
              </el-upload>
            </div>
            <div class="column"
                 style="margin-left: 100px;">
              <span>{{ $t('service.contactUs') }}</span>
              <q-img :style="{ width: '100px', height: '100px', border: '1px  solid grey' }"
                     :src="userInfo.qrCodeUrl" />
              <el-upload class="upload-demo mt-3"
                         action=""
                         :http-request="beforeuploadQR"
                         :show-file-list="false"
                         accept="image/jpg,image/jpeg,image/png">
                <el-button type="primary">{{ $t('profile.selectimage') }}</el-button>
              </el-upload>

            </div>
            <el-button type="text"
                       @click="openWx">企业微信二维码</el-button>
          </div>
        </el-form-item>
        <el-form-item :label="$t('service.name')">
          <el-input v-model="userInfo.chatAiName"></el-input>
        </el-form-item>
        <el-form-item :label="$t('service.greeting')">
          <el-input type="textarea"
                    :rows="3"
                    v-model="userInfo.chatAiGreeting"></el-input>
        </el-form-item>
        <el-form-item :label="$t('service.ending')">
          <el-input type="textarea"
                    :rows="3"
                    v-model="userInfo.chatAiPeroration"></el-input>
        </el-form-item>
        <el-form-item :label="$t('service.Rechargereminder')">
          <el-input type="textarea"
                    :rows="3"
                    v-model="userInfo.rechargeReminder"></el-input>
        </el-form-item>
        <el-form-item class="mt-5">
          <el-button type="primary"
                     @click="handleSave">{{ $t('service.save') }}</el-button>

        </el-form-item>
      </el-form>
    </div>

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
import { getSfbots, updateSfbot } from 'src/graphql/queries/chatbot'
import {
  getLegalDocumentProject,
  updateLegalDocumentProject,
} from 'src/graphql/queries/project'
import { storeAuthToken } from 'src/utils/authToken'
import notify from 'src/boot/notify'
import store from 'src/store/store'
import { uploadOSS, OSSConfig } from 'src/boot/oss'
import { getters, mutations } from '../store/store'
import eventBus from '../utils/eventBus'
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from 'src/utils/isMobileBrowser'
export default defineComponent({
  name: 'Login',
  data() {
    return {
      isPwd: true,
      isNetWrok: true,
      isMobile: getIsMobileBrowser(),
    }
  },
  mounted() {
    watchIsMobileBrowser(this, 'isMobile')
  },
  setup(props, { root }) {
    const currentUser = computed(getters.currentUser)
    const { mutate: getLegalDocumentProjectMutation } = useMutation(
      getLegalDocumentProject
    )
    const { mutate: updateLegalDocumentProjectMutation } = useMutation(
      updateLegalDocumentProject
    )
    const { mutate: getSfbotsMutation } = useMutation(getSfbots)
    const { mutate: updateSfbotMutation } = useMutation(updateSfbot)

    const userInfo = reactive({
      id: 0,
      chatAiName: '',
      chatAiGreeting: '',
      chatAiAvatarUrl: '',
      qrCodeUrl: '',
      chatAiPeroration: '',
      rechargeReminder: '',
    })
    // const getProjectInfo = async () => {
    //   const res = await getSfbotsMutation({})
    //   if (res) {
    //     userInfo.chatAiName = res.data.getSfbots[0].chatAiName
    //     userInfo.chatAiAvatarUrl = res.data.getSfbots[0].chatAiAvatarUrl
    //     userInfo.chatAiGreeting = res.data.getSfbots[0].chatAiGreeting
    //     userInfo.chatAiPeroration = res.data.getSfbots[0].chatAiPeroration
    //     userInfo.rechargeReminder = res.data.getSfbots[0].rechargeReminder
    //     userInfo.id = res.data.getSfbots[0].id
    //   }
    //   }

    const getProjectInfo = async () => {
      const res = await getLegalDocumentProjectMutation({
        id: Number(sessionStorage.getItem('legalDocumentProjectId')),
      })
      if (res) {
        userInfo.chatAiName = res.data.getLegalDocumentProject.chatAiName
        userInfo.chatAiAvatarUrl =
          res.data.getLegalDocumentProject.chatAiAvatarUrl
        userInfo.qrCodeUrl = res.data.getLegalDocumentProject.qrCodeUrl
        userInfo.chatAiGreeting =
          res.data.getLegalDocumentProject.chatAiGreeting
        userInfo.chatAiPeroration =
          res.data.getLegalDocumentProject.chatAiPeroration
        userInfo.rechargeReminder =
          res.data.getLegalDocumentProject.rechargeReminder
        userInfo.id = res.data.getLegalDocumentProject.id
      }
    }
    const openWx = () => {
      window.open(
        'https://work.weixin.qq.com/wework_admin/frame#csPlugin',
        '_blank'
      )
    }
    const beforeupload = async (file) => {
      const result = await uploadOSS(file.file)

      userInfo.chatAiAvatarUrl = result.fileUrl
      return result.fileUrl
    }
    const beforeuploadQR = async (file) => {
      const result = await uploadOSS(file.file)

      userInfo.qrCodeUrl = result.fileUrl
      return result.fileUrl
    }
    const handleSave = async () => {
      const legalDocumentProject = {
        chatAiName: userInfo.chatAiName,
        chatAiAvatarUrl: userInfo.chatAiAvatarUrl,
        qrCodeUrl: userInfo.qrCodeUrl,
        chatAiGreeting: userInfo.chatAiGreeting,
        chatAiPeroration: userInfo.chatAiPeroration,
        rechargeReminder: userInfo.rechargeReminder,
      }
      const res = await updateLegalDocumentProjectMutation({
        id: userInfo.id,
        legalDocumentProject: legalDocumentProject,
      })

      if (res) {
        notify.success(root.$t('notify.Done'))
      }
    }

    onMounted(() => {
      //   getProjectInfo()
      //   eventBus.$on('switchProject', (caseId) => {
      //     getProjectInfo()
      //   })
      eventBus.$on('switchNewProject', (info) => {
        if (info) {
          userInfo.chatAiName = info.chatAiName
          userInfo.chatAiAvatarUrl = info.chatAiAvatarUrl
          userInfo.qrCodeUrl = info.qrCodeUrl
          userInfo.chatAiGreeting = info.chatAiGreeting
          userInfo.chatAiPeroration = info.chatAiPeroration
          userInfo.rechargeReminder = info.rechargeReminder
          userInfo.id = info.id
        }
      })
    })
    return {
      handleSave,
      beforeupload,
      beforeuploadQR,
      openWx,
      userInfo,
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

