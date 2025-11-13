<template>
  <div class="px-10 py-10">
    <el-button class="float-right "
               style="margin-bottom: 10px;"
               type="primary"
               @click="handleManage()">
      {{ $t("kb.Manage") }}
    </el-button>
    <el-table :data="tableData"
              style="width: 100%"
              class="mb-5 "
              border
              :empty-text="$t('People.noData')">
      <el-table-column prop="id"
                       :label="$t('kb.id')"
                       align="center"
                       min-width="100%">

      </el-table-column>
      <el-table-column prop="name"
                       :label="$t('kb.name')"
                       align="center"
                       min-width="100%">
      </el-table-column>
      <el-table-column prop="description"
                       :label="$t('kb.description')"
                       align="center"
                       min-width="165%">
      </el-table-column>

      <el-table-column :label="$t('People.action')"
                       align="center"
                       min-width="180%">
        <template slot-scope="scope">
          <el-button @click="handleDetail( scope.row)"
                     type="text">
            {{ $t("kb.Detail") }}
          </el-button>

        </template>
      </el-table-column>
    </el-table>

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
import { getZhiPuAllKb } from 'src/graphql/queries/kb'
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
    return {}
  },
  mounted() {
    watchIsMobileBrowser(this, 'isMobile')
  },
  setup(props, { root }) {
    const { mutate: getZhiPuAllKbMutation } = useMutation(getZhiPuAllKb)
    const tableData = ref([])
    const getAllKB = async () => {
      const res = await getZhiPuAllKbMutation()
      if (res) {
        console.log('111111111111getAllKB', JSON.parse(res.data.getZhiPuAllKb))
        tableData.value = JSON.parse(res.data.getZhiPuAllKb).data.list
      }
    }
    const handleManage = async () => {
      window.open('https://open.bigmodel.cn/appcenter_v1/knowledge')
    }
    const handleDetail = async (item) => {
      window.open('https://open.bigmodel.cn/appcenter_v1/knowledge/' + item.id)
    }
    onMounted(() => {
      getAllKB()
    })
    return {
      tableData,
      handleDetail,
      handleManage,
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

