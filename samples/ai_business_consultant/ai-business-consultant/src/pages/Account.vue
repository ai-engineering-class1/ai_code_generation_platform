<template>
  <div>
    <div class="bg-white flex"
         style="margin-top: 30px"
         v-if="currentUser.role ==5">
      <div :class=" 'w-1/4'">
        <div class="chart">
          <div class="title">{{$t('Account.Lastmonthcommission')}}</div>

          <!-- <div class="num-data">{{taskoverview.noStart}}</div> -->
          <div class="num-data">
            <span style="color: #0747a6; font-size: 35px">
              {{(accountInfo.lastMonthCommission/ 100).toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
      <div :class=" 'w-1/4' ">
        <div class="chart">
          <div class="">
            <div class="title">{{$t('Account.Thismonthcommission')}}</div>
          </div>

          <div class="num-data">
            <span style="color: orange; font-size: 35px">
              {{ (accountInfo.currentMonthCommission/ 100).toFixed(2) }}
            </span>
            <!-- <div class="num-data">{{taskoverview.inProgress}}</div> -->
          </div>
        </div>
      </div>
      <div :class=" 'w-1/4' ">
        <div class="chart">
          <div class="">
            <div class="title">{{$t('Account.Withdrawableamount')}}</div>
          </div>
          <div class="num-data">
            <!-- <div class="num-data"> {{taskoverview.done}} </div> -->
            <span style="color: green; font-size: 35px">
              {{ (accountInfo.withdrawableAmount / 10000).toFixed(2)}}
            </span>
          </div>
        </div>
      </div>
      <!-- :disabled="(accountInfo.withdrawableAmount / 10000).toFixed(2)<10" -->
      <div class=" container">
        <el-button type="primary"
                   @click="handleWithdrawal">{{$t('Account.Withdrawal') }}</el-button>

        <el-button class="ml-10"
                   @click="handleWithdrawalDetail">
          {{$t('Account.WithdrawalLog') }}</el-button>
      </div>
    </div>

    <div id="chart"
         class="mt-3"
         v-if="currentUser.role ==5"
         style="width: 100%;height:400px;"></div>
    <div style="padding: 10px;">
      <div style="  font-size: 16px;
  font-weight: bold;"
           class="num-data">{{ currentUser.role ==5?$t('Account.WithdrawalDetail'): $t('Account.SaleDetail')}}</div>

      <el-date-picker v-model="selectDate"
                      type="date"
                      class="mt-3"
                      @change="handleChangeDate"
                      placeholder="选择日期">
      </el-date-picker>

      <el-table :data=" WithdrawalDetailData.slice((currentPage3-1)*pageSize3, currentPage3*pageSize3)"
                style="width: 100%"
                class="mt-5"
                border
                cell-style="padding-top: 5px; padding-bottom: 5px;"
                :empty-text="$t('People.noData')">
        <el-table-column prop="wxUserId"
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
        </el-table-column>
        <el-table-column prop="out_trade_no"
                         :label="$t('order.orderNO')"
                         align="center"
                         min-width="100%">
        </el-table-column>
        <el-table-column prop="createdAt"
                         :label="$t('order.createdAt')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ format(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <!-- <el-table-column prop="total"
                         :label="$t('Account.goodsName')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ scope.row.commodity.name }}
          </template>
        </el-table-column> -->
        <el-table-column prop="total"
                         :label="$t('order.total')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ scope.row.total==0?'-':(scope.row.total)/100 }}
          </template>
        </el-table-column>
        <el-table-column prop="total"
                         label="t1分成"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ scope.row.t1_share ==0?'-':(scope.row.t1_share)/10000 }}
          </template>
        </el-table-column>
        <el-table-column prop="total"
                         label="t2分成"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ scope.row.t2_share ==0?'-':(scope.row.t2_share)/10000 }}
          </template>
        </el-table-column>

      </el-table>
      <el-pagination @size-change="handleSizeChange3"
                     @current-change="handleCurrentChange3"
                     :current-page="currentPage"
                     :page-sizes="[5, 10, 20, 50]"
                     :page-size="pageSize"
                     :total="WithdrawalDetailData.length"
                     layout="total, sizes, prev, pager, next, jumper">
      </el-pagination>
    </div>

    <el-dialog :close-on-click-modal="false"
               :visible.sync="detailDialog"
               :title="$t('Account.WithdrawalLog')"
               :width="'70%'"
               :append-to-body="true"
               class="channel-dialog">
      <el-table :data="tableData"
                style="width: 100%"
                class="mb-5"
                border
                cell-style="padding-top: 5px; padding-bottom: 5px;"
                :empty-text="$t('People.noData')">
        <el-table-column prop="amount"
                         :label="$t('Account.amount')"
                         align="center">
          <template slot-scope="scope">
            <span> {{ (scope.row.amount/ 100).toFixed(2)}} </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt"
                         :label="$t('Account.Date')"
                         align="center">
          <template slot-scope="scope">

            <span> {{format(scope.row.createdAt ) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="approvedDate"
                         :label="$t('Account.ApproveDate')"
                         align="center">
          <template slot-scope="scope">

            <span> {{format(scope.row.approvedDate ) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="batch_status"
                         :label="$t('Withdrawal.status')"
                         align="center">
          <template slot-scope="scope">
            {{ handleState(scope.row.batch_status)}}
          </template>
        </el-table-column>
        <el-table-column prop="batch_status"
                         align="center">
          <template slot-scope="scope">
            <el-button type="text"
                       @click=handleDetail(scope.row)>{{ $t('Account.detail') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination @size-change="handleSizeChange"
                     @current-change="handleCurrentChange"
                     :current-page="currentPage"
                     :page-sizes="[5, 10, 20, 50]"
                     :page-size="pageSize"
                     :total="total"
                     layout="total, sizes, prev, pager, next, jumper">
      </el-pagination>
    </el-dialog>

    <el-dialog :close-on-click-modal="false"
               :visible.sync="commissionDetailDialog"
               :title="$t('Account.detail')"
               :width="'70%'"
               :append-to-body="true"
               class="channel-dialog">
      <el-table :data=" detailTableData.slice((currentPage2-1)*pageSize2, currentPage2*pageSize2)"
                style="width: 100%"
                class="mb-5"
                border
                cell-style="padding-top: 5px; padding-bottom: 5px;"
                :empty-text="$t('People.noData')">
        <el-table-column prop="wxUserId"
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
        </el-table-column>
        <el-table-column prop="out_trade_no"
                         :label="$t('order.orderNO')"
                         align="center"
                         min-width="100%">
        </el-table-column>
        <el-table-column prop="createdAt"
                         :label="$t('order.createdAt')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ format(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <!-- <el-table-column prop="total"
                         :label="$t('Account.goodsName')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ scope.row.commodity.name }}
          </template>
        </el-table-column> -->
        <el-table-column prop="total"
                         :label="$t('order.total')"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ scope.row.total==0?'-':(scope.row.total)/100 }}
          </template>
        </el-table-column>
        <el-table-column prop="total"
                         label="t1分成"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ scope.row.t1_share ==0?'-':(scope.row.t1_share)/10000 }}
          </template>
        </el-table-column>
        <el-table-column prop="total"
                         label="t2分成"
                         align="center"
                         min-width="100%">
          <template slot-scope="scope">
            {{ scope.row.t2_share ==0?'-':(scope.row.t2_share)/10000 }}
          </template>
        </el-table-column>

      </el-table>
      <el-pagination @size-change="handleSizeChange2"
                     @current-change="handleCurrentChange2"
                     :current-page="currentPage"
                     :page-sizes="[5, 10, 20, 50]"
                     :page-size="pageSize"
                     :total="detailTableData.length"
                     layout="total, sizes, prev, pager, next, jumper">
      </el-pagination>
    </el-dialog>
  </div>
</template>  
  
<script>
// 引入ECharts主模块
import * as echarts from 'echarts'
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
import validator from 'src/utils/validator'
import notify from 'src/boot/notify'
import { Dialog, Loading } from 'quasar'
import {
  getOrgDistributorCommissionStatistics,
  getOrgDistributorCommissionBalance,
  getTwoMonthDistributorWithdrawFunds,
  getDistributorWithdrawFundsAndCount,
  distributorApplyWxIncomeTransfer,
  getWxPaidOrdersByDate,
} from 'src/graphql/queries/distributor'

export default defineComponent({
  data() {
    return {
      currentPage2: 1, // 当前页
      pageSize2: 10, // 每页显示条数
      currentPage3: 1, // 当前页
      pageSize3: 10, // 每页显示条数
    }
  },

  setup(props, { root }) {
    // 指定图表的配置项和数据
    const option = {
      title: {
        text: '最近一周金额统计',
      },
      tooltip: {},
      xAxis: {
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      },
      yAxis: {},
      series: [
        {
          name: '金额（元）',
          type: 'line',
          data: [120, 200, 150, 80, 70, 110, 130],
        },
      ],
    }
    const format = (date, format = 'YYYY/MM/DD  HH:mm:ss') => {
      return date ? dayjs(date).format(format) : date
    }
    const formatDateTime = (date, format = 'YYYY-MM-DD') => {
      return date ? dayjs(date).format(format) : date
    }
    const selectDate = ref(formatDateTime(new Date()))
    const currentUser = computed(getters.currentUser)
    const total = ref(0)
    const detailTableData = ref([])
    const strToJson = (str) => {
      var json = eval('[' + str + ']')
      return json ? json[0] : []
    }

    const { mutate: getStaticMutation } = useMutation(
      getOrgDistributorCommissionStatistics
    )
    const { mutate: getWxPaidOrdersByDateMutation } = useMutation(
      getWxPaidOrdersByDate
    )
    const { mutate: getBalanceMutation } = useMutation(
      getOrgDistributorCommissionBalance
    )
    const commissionDetailDialog = ref(false)
    const handleState = (state) => {
      switch (state) {
        case 'PROCESSING':
          return '待审批'
        case 'ACCEPTED':
          return '审批通过'
        case 'FINISHED':
          return '提现完成'
      }
    }

    const WithdrawalDetailData = ref([])
    const getWxPaidOrders = async () => {
      const res = await getWxPaidOrdersByDateMutation({
        date: selectDate.value,
      })
      if (res) {
        WithdrawalDetailData.value = res.data.getWxPaidOrdersByDate
      }
    }
    const handleChangeDate = async () => {
      getWxPaidOrders()
    }
    const handleDetail = (row) => {
      detailTableData.value = row.t1WxPaidOrders.concat(row.t2WxPaidOrders)
      commissionDetailDialog.value = true
      console.log(row)
    }
    const { mutate: getTwoMonthMutation } = useMutation(
      getTwoMonthDistributorWithdrawFunds
    )
    const { mutate: distributorApplyWxIncomeTransferMutation } = useMutation(
      distributorApplyWxIncomeTransfer
    )
    const { mutate: getDistributorWithdrawFundsMutation } = useMutation(
      getDistributorWithdrawFundsAndCount
    )

    const getStatistics = async () => {
      const res = await getStaticMutation({ lastDate: 7 })

      let dataR = strToJson(res.data.getOrgDistributorCommissionStatistics)
      console.log(dataR)
      let x = []
      let y = []
      for (const item of dataR) {
        x.push(item.date)
        y.push(item.amount / 10000)
      }
      option.xAxis.data = x.reverse()
      option.series[0].data = y.reverse()
      const chartItem = document.getElementById('chart')
      const charts = echarts.init(chartItem)
      charts.setOption(option)
      console.log(res)
    }
    const accountInfo = ref({
      lastMonthCommission: 10000,
      currentMonthCommission: 12000,
      withdrawableAmount: 8000,
    })
    const getBalance = async () => {
      const res = await getBalanceMutation()
      if (res) {
        accountInfo.value.withdrawableAmount = JSON.parse(
          res.data.getOrgDistributorCommissionBalance
        ).amount
      }
      console.log(res)
    }
    const currentPage = ref(1) // 当前页
    const pageSize = ref(10) // 每页显示条数
    const handleSizeChange = (val) => {
      pageSize.value = val
      getDistributorWithdrawFunds()
    }
    const handleCurrentChange = (val) => {
      currentPage.value = val
      getDistributorWithdrawFunds()
    }
    const getTwoMonth = async () => {
      const res = await getTwoMonthMutation()
      if (res) {
        accountInfo.value.lastMonthCommission = JSON.parse(
          res.data.getTwoMonthDistributorWithdrawFunds
        ).lastMonthAmount
        accountInfo.value.currentMonthCommission = JSON.parse(
          res.data.getTwoMonthDistributorWithdrawFunds
        ).thisMonthAmount
      }
    }
    const tableData = ref([])
    const getDistributorWithdrawFunds = async () => {
      const res = await getDistributorWithdrawFundsMutation()
      if (res) {
        tableData.value = res.data.getDistributorWithdrawFundsAndCount.data
        total.value = res.data.getDistributorWithdrawFundsAndCount.totalCount
        console.log('------------------res=', tableData.value)
      }
    }

    const handleWithdrawal = () => {
      if (!currentUser.value.wxUserId) {
        notify.error('请绑定微信账号!')
        return
      }
      if (!currentUser.value.realName) {
        notify.error('请在个人资料填写真实姓名!')
        return
      }
      Dialog.create({
        title: root.$t('People.confirm'),
        message: root.$t('Account.WithdrawalInfo'),
        ok: {
          label: root.$t('People.confirm'),
          noCaps: true,
        },
        cancel: {
          label: root.$t('People.cancel'),
          noCaps: true,
          flat: true,
        },
        style: {
          zIndex: 10002,
        },
      }).onOk(async () => {
        try {
          const res = await distributorApplyWxIncomeTransferMutation()
          notify.success('提现申请已提交！')
          getStatistics()
          getBalance()
          getTwoMonth()
        } catch (e) {
          console.log(e)
          notify.error(e.message)
        }
      })
    }
    const detailDialog = ref(false)
    const handleWithdrawalDetail = () => {
      detailDialog.value = true
      getDistributorWithdrawFunds()
    }
    onMounted(() => {
      getStatistics()
      getBalance()
      getTwoMonth()
      getWxPaidOrders()
    })

    return {
      accountInfo,
      handleDetail,
      currentPage,
      pageSize,
      total,
      handleCurrentChange,
      handleSizeChange,
      format,
      WithdrawalDetailData,
      detailDialog,
      handleChangeDate,
      commissionDetailDialog,
      detailTableData,
      selectDate,
      handleState,
      currentUser,
      tableData,
      handleWithdrawal,
      handleWithdrawalDetail,
    }
  },
  methods: {
    handleCurrentChange2(val) {
      this.currentPage2 = val
    },
    // 每页显示条数改变
    handleSizeChange2(val) {
      this.pageSize2 = val
    },
    handleCurrentChange3(val) {
      this.currentPage3 = val
    },
    // 每页显示条数改变
    handleSizeChange3(val) {
      this.pageSize3 = val
    },
  },
})
</script>  
  
<style scoped>
/* 在这里添加您的样式 */
.dashboard-page {
  padding: 0 15px;
}
.chart {
  box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.1);
  margin: 0 10px;
  padding: 10px;
  position: relative;
}
.chart-content {
  width: 100%;
  max-width: 100%;
  position: relative;
}
.page-title {
  margin-top: 40px;
  font-size: 20px;
}
.page-des {
  color: #5e6c84;
  margin-bottom: 30px;
}
.chart .title {
  font-size: 16px;
  font-weight: bold;
}
.chart .des {
  color: #666;
  font-size: 12px;
  margin: 6px 0;
}
.chart select {
  width: 100px;
  background-color: #f4f5f7;
  height: 30px;
  border-radius: 3px;
}
.chart .all-ticket-time {
  color: #444;
  margin-top: 10px;
  margin-bottom: 10px;
}
.chart .title-part {
  /* min-height: 175px; */
  min-height: 125px;
  position: relative;
}
.chart .i-icon {
  font-size: 20px;
  position: absolute;
  top: 20px;
  right: 20px;
  color: #666;
  cursor: pointer;
}
.chart .num-data {
  padding: 10px;
  text-align: center;
  font-size: 40px;
}
.chart .num-des {
  font-size: 18px;
}
.edit-part div {
  line-height: 28px;
  cursor: pointer;
}
.echart-dialog .el-form-item__label {
  line-height: 30px;
  padding-bottom: 5px;
}
.chart .name {
  color: #1976d2;
  font-size: 16px;
}
.chart .project-name {
  margin-bottom: 8px;
}
.chart .chart-des {
  margin-top: 8px;
}
.chart .chart-des {
  color: #5e6c84;
}
.chart .customer-title {
  min-height: 140px;
}
.container {
  width: 250px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>