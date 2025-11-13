<template>
  <div class="q-pa-md container"
       style="height: 620px;">

    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">

      <el-form class="w-full"
               label-position="top"
               label-width="200px">
        <el-form-item>
          <el-input type="textarea"
                    :rows="3"
                    v-model="remark"></el-input>
        </el-form-item>
        <el-form-item class="mt-10">
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
import eventBus from '../utils/eventBus'
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
      chatAiPeroration: '',
      rechargeReminder: '',
    })
    const remark = ref('')

    const getProjectInfo = async () => {
      const res = await getLegalDocumentProjectMutation({
        id: Number(sessionStorage.getItem('legalDocumentProjectId')),
      })
      if (res) {
        remark.value = res.data.getLegalDocumentProject.desc
      }
    }

    const beforeupload = async (file) => {
      const result = await uploadOSS(file.file)

      userInfo.chatAiAvatarUrl = result.fileUrl
      return result.fileUrl
    }

    const handleSave = async () => {
      const legalDocumentProject = {
        desc: remark.value,
      }
      const res = await updateLegalDocumentProjectMutation({
        id: Number(sessionStorage.getItem('legalDocumentProjectId')),
        legalDocumentProject: legalDocumentProject,
      })

      if (res) {
        eventBus.$emit('updateRemark')
        notify.success(root.$t('notify.Done'))
      }
    }

    onMounted(() => {
      //   getProjectInfo()
      //   eventBus.$on('switchProject', (caseId) => {
      //     getProjectInfo()
      //   })
      eventBus.$on('switchNewProject', (info) => {
        remark.value = info.desc
      })
    })
    return {
      handleSave,
      beforeupload,
      userInfo,
      remark,
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

