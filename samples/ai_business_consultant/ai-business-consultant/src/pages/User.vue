<template>
  <div class="w-full h-full px-12 ">
    <el-tabs class="mx-2 "
             v-model="activeName">
      <el-tab-pane :label="$t('People.vailUser')"
                   name="1">
        <div style="width: 100%;margin:15px 0;display:flex;justify-content: space-between;">
          <el-input v-model="searchPeopleValue"
                    style="width: 200px;"
                    clearable
                    :placeholder="$t('People.searchForName')"
                    @input="handleInputSearch"><i slot="prefix"
               class="el-input__icon el-icon-search"></i></el-input>
        </div>
        <div>
          <el-table :data="wxUserData"
                    style="width: 100%"
                    class="mb-5"
                    border
                    :loading="Loading"
                    :empty-text="$t('People.noData')">
            <el-table-column :label="$t('People.User')"
                             align="center"
                             min-width="100%">
              <template slot-scope="scope">
                <div style="width:100%;display:flex;align-items: center;justify-content: left;margin-left:10px;">
                  <j-avatar :size="28"
                            :avatarUrl="scope.row.avatarUrl"
                            :name="'xxxxx'"
                            class="shadow-outline-white -ml-1" />
                  <span style="margin-left: 10px;">{{ scope.row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="lastPayDate"
                             :label="$t('People.Whethertopay')"
                             align="center"
                             :formatter="isPay"
                             min-width="100%">
            </el-table-column>
            <el-table-column prop="createdAt"
                             :label="$t('People.Authorizationtime')"
                             align="center"
                             min-width="165%">
              <template slot-scope="scope">
                {{ scope.row.createdAt == null?'':formatterTime(scope.row.createdAt)}}
              </template>
            </el-table-column>
            <el-table-column prop="lastOperateDate"
                             :label="$t('People.Recentconversationtime')"
                             align="center"
                             min-width="165%">
              <template slot-scope="scope">
                {{ scope.row.lastOperateDate == null?'':formatterTime(scope.row.lastOperateDate)}}
              </template>
            </el-table-column>
            <el-table-column :label="$t('People.action')"
                             align="center"
                             min-width="180%">
              <template slot-scope="scope">
                <!-- <el-button @click="handleEcording(scope.$index, scope.row)"
                       type="text">
              {{ $t("People.Dialoguerecording") }}
            </el-button> -->
                <el-button v-if="scope.row.lastPayDate"
                           @click="handleOrders( scope.row)"
                           type="text">
                  {{ $t("People.Vieworders") }}
                </el-button>
              </template>
            </el-table-column>
            <!-- <el-table-column prop="lastOperateDate"
                             label="推广是否有效"
                             align="center"
                             min-width="165%">
              <template slot-scope="scope">
                {{ scope.row.distributorId ?'有效':'无效'}}
              </template>
            </el-table-column> -->
          </el-table>
          <el-pagination @size-change="handleSizeChange"
                         @current-change="handleCurrentChange"
                         :current-page="currentPage"
                         :page-sizes="[5, 10, 20, 50]"
                         :page-size="pageSize"
                         :total="total"
                         layout="total, sizes, prev, pager, next, jumper">
          </el-pagination>
        </div>
      </el-tab-pane>
      <el-tab-pane :label="$t('People.invailUser')"
                   name="2">
        <!-- <div style="width: 100%;margin:15px 0;display:flex;justify-content: space-between;">
          <el-input v-model="searchInvailPeopleValue"
                    style="width: 200px;"
                    clearable
                    :placeholder="$t('People.searchForName')"
                    @input="handleInputSearch"><i slot="prefix"
               class="el-input__icon el-icon-search"></i></el-input>
        </div> -->
        <div>
          <el-table :data="invailUser"
                    style="width: 100%"
                    class="mb-5"
                    border
                    :loading="Loading"
                    :empty-text="$t('People.noData')">
            <el-table-column :label="$t('People.User')"
                             align="center"
                             min-width="100%">
              <template slot-scope="scope">
                <div style="width:100%;display:flex;align-items: center;justify-content: left;margin-left:10px;">
                  <j-avatar :size="28"
                            :avatarUrl="scope.row.wxUser.avatarUrl"
                            :name="'xxxxx'"
                            class="shadow-outline-white -ml-1" />
                  <span style="margin-left: 10px;">{{ scope.row.wxUser.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="lastPayDate"
                             :label="$t('People.Whethertopay')"
                             align="center"
                             :formatter="isPay"
                             min-width="100%">
            </el-table-column>
            <el-table-column prop="createdAt"
                             :label="$t('People.Authorizationtime')"
                             align="center"
                             min-width="165%">
              <template slot-scope="scope">
                {{ scope.row.wxUser.createdAt == null?'':formatterTime(scope.row.wxUser.createdAt)}}
              </template>
            </el-table-column>
            <!-- <el-table-column prop="lastOperateDate"
                             :label="$t('People.Recentconversationtime')"
                             align="center"
                             min-width="165%">
              <template slot-scope="scope">
                {{ scope.row.lastOperateDate == null?'':formatterTime(scope.row.lastOperateDate)}}
              </template>
            </el-table-column> -->
          </el-table>
          <el-pagination @size-change="handleSizeChange1"
                         @current-change="handleCurrentChange1"
                         :current-page="currentPage1"
                         :page-sizes="[5, 10, 20, 50]"
                         :page-size="pageSize1"
                         :total="invailtotal"
                         layout="total, sizes, prev, pager, next, jumper">
          </el-pagination>
        </div>
      </el-tab-pane>
    </el-tabs>
    <el-dialog :close-on-click-modal="false"
               width="60%"
               :visible.sync="dialogFormVisible">
      <el-table :data="tableData"
                style="width: 100%"
                class="mb-5 "
                border
                :empty-text="$t('People.noData')">
        <!-- <el-table-column prop="wxUserId"
                         :label="$t('order.userId')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            <div style="width:100%;display:flex;align-items: center;justify-content: left;margin-left:10px;">
              <j-avatar :size="28"
                        :avatarUrl="scope.row.wxUser.avatarUrl"
                        :name="'xxxxx'"
                        class="shadow-outline-white -ml-1" />
              <span style="margin-left: 10px;">{{ scope.row.wxUser.name }}</span>
            </div>
          </template>
        </el-table-column> -->
        <el-table-column prop="out_trade_no"
                         :label="$t('order.orderNO')"
                         align="center"
                         min-width="100%">
        </el-table-column>
        <el-table-column prop="success_time"
                         :label="$t('order.createdAt')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ forateTime(scope.row.success_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="state"
                         :label="$t('order.status')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ handleState(scope.row.state) }}
          </template>
        </el-table-column>
        <el-table-column prop="total"
                         :label="$t('order.total')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ (scope.row.total)/100 }}
          </template>
        </el-table-column>

      </el-table>
    </el-dialog>
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  ref,
  reactive,
  computed,
  onMounted,
} from '@vue/composition-api'
import { mutations, getters } from '../store/store'
import { useMutation } from '@vue/apollo-composable'
import dayjs from 'dayjs'
import notify from 'src/boot/notify'
import { Dialog } from 'quasar'
import { getSelfWxPaidOrders } from 'src/graphql/queries/order'
import {
  getWxUsersAndCount,
  getWxUserScanDistributorRecordsAndCount,
} from 'src/graphql/queries/people'
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from 'src/utils/isMobileBrowser'
export default defineComponent({
  data() {
    return {
      isMobile: getIsMobileBrowser(),
    }
  },
  mounted() {
    watchIsMobileBrowser(this, 'isMobile')
  },
  setup(props, { root }) {
    // 获取人员信息
    const Loading = ref(false)
    const allUserData = ref<any>([])
    const wxUserData = ref<any>([])
    const invailUser = ref<any>([])
    const tableData = ref([])
    const { mutate: WxPaidOrdersMutation } = useMutation(getSelfWxPaidOrders)
    const dialogFormVisible = ref(false)
    const getPayOrder = async (id) => {
      const res = await WxPaidOrdersMutation({ openid: id } as any)
      if (res) {
        tableData.value = res.data.getSelfWxPaidOrders
      }
      dialogFormVisible.value = true
    }
    const { mutate: getWxUsersMutation } = useMutation(getWxUsersAndCount)
    const { mutate: getWxUserScanDistributorRecordsMutation } = useMutation(
      getWxUserScanDistributorRecordsAndCount
    )
    const total = ref(0)
    const invailtotal = ref(0)
    const getWxUser = async () => {
      try {
        Loading.value = true
        const res = await getWxUsersMutation({
          take: pageSize.value,
          skip: (currentPage.value - 1) * pageSize.value,
          name: searchPeopleValue.value,
        } as any)
        if (res) {
          allUserData.value = res.data.getWxUsersAndCount.data
          wxUserData.value = res.data.getWxUsersAndCount.data
          total.value = res.data.getWxUsersAndCount.totalCount
          Loading.value = false
          console.log(wxUserData.value)
        }
      } catch (error) {
        console.log('----------getPeople error')
      }
    }

    const getInvailUser = async () => {
      try {
        const res = await getWxUserScanDistributorRecordsMutation({
          take: pageSize1.value,
          skip: (currentPage1.value - 1) * pageSize1.value,
          //  name: searchInvailPeopleValue.value,
        } as any)
        console.log(res)
        if (res) {
          invailUser.value =
            res.data.getWxUserScanDistributorRecordsAndCount.data
          invailtotal.value =
            res.data.getWxUserScanDistributorRecordsAndCount.totalCount

          console.log(invailUser.value)
        }
      } catch (error) {
        console.log('----------getPeople error')
      }
    }
    const handleState = (state) => {
      switch (state) {
        case 'SUCCESS':
          return '支付成功'
        case 'USERPAYING':
          return '用户支付中'
        case 'REFUND':
          return '转入退款'
        case 'NOTPAY':
          return '未支付'
        case 'CLOSED':
          return '已关闭'
        case 'REFUND':
          return '转入退款'
      }
    }
    // 时间戳
    const forateTime = (date, format = 'YYYY/MM/DD  HH:mm:ss') => {
      return date ? dayjs(date).format(format) : date
    }
    const getToday = (date, format = 'YYYY-MM-DD ') => {
      return date ? dayjs(date).format(format) : date
    }
    const formatterTime = (row) => {
      let FormatTime = forateTime(row)
      return FormatTime
    }

    //是否付费
    const isPay = (row) => {
      if (row.lastPayDate) {
        return root.$t('People.yes')
      } else {
        return root.$t('People.no')
      }
    }

    // 搜索人员
    const searchPeopleValue = ref<any>('')
    const searchInvailPeopleValue = ref<any>('')
    const handleInputSearch = () => {
      getWxUser()
    }
    onMounted(() => {
      getWxUser()
      getInvailUser()
    })

    // 查看对话记录
    const handleEcording = (index, row) => {}

    // 查看订单
    const handleOrders = (row) => {
      getPayOrder(row.openId)
    }
    const currentPage = ref(1) // 当前页
    const pageSize = ref(10) // 每页显示条数
    const handleSizeChange = (val) => {
      pageSize.value = val
      getWxUser()
    }
    // 当前页改变
    const handleCurrentChange = (val) => {
      currentPage.value = val
      getWxUser()
    }

    const currentPage1 = ref(1) // 当前页
    const pageSize1 = ref(10) // 每页显示条数
    const handleSizeChange1 = (val) => {
      pageSize1.value = val
      getInvailUser()
    }
    // 当前页改变
    const handleCurrentChange1 = (val) => {
      currentPage1.value = val
      getInvailUser()
    }
    return {
      currentPage,
      pageSize,
      currentPage1,
      pageSize1,
      invailUser,
      activeName: '1',
      handleSizeChange,
      handleCurrentChange,
      handleSizeChange1,
      handleCurrentChange1,
      searchPeopleValue,
      searchInvailPeopleValue,
      handleInputSearch,
      formatterTime,
      forateTime,
      total,
      invailtotal,
      dialogFormVisible,
      wxUserData,
      tableData,
      handleState,
      isPay,
      Loading,
      handleEcording,
      handleOrders,
    }
  },
})
</script>
<style scoped>
</style>
<style scoped>
</style>

