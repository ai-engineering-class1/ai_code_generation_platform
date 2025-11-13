<template>
  <div class="w-full h-full px-12 ">

    <div style="width: 100%;margin:15px 0;display:flex;justify-content: space-between;">
      <!-- <el-input v-model="searchValue"
                style="width: 200px;"
                clearable
                :placeholder="$t('People.searchForName')"
                @input="handleInputSearch"><i slot="prefix"
           class="el-input__icon el-icon-search"></i></el-input> -->
    </div>
    <div>
      <el-table :data="tableData"
                style="width: 100%"
                class="mb-5"
                border
                :loading="Loading"
                :empty-text="$t('People.noData')">

        <el-table-column prop="distributor"
                         :label="$t('Withdrawal.Distributor')"
                         align="center"
                         :formatter="isPay"
                         min-width="100%">
          <template slot-scope="scope">
            {{ scope.row.distributor.name}}
          </template>
        </el-table-column>
        <el-table-column prop="amount"
                         :label="$t('Withdrawal.Withdrawableamount')"
                         align="center"
                         min-width="165%">
          <template slot-scope="scope">
            {{ (scope.row.amount/ 100).toFixed(2)}}
          </template>
        </el-table-column>
        <el-table-column prop="batch_status"
                         :label="$t('Withdrawal.status')"
                         align="center"
                         min-width="165%">
          <template slot-scope="scope">
            {{ handleState(scope.row.batch_status)}}
          </template>
        </el-table-column>
        <!-- <el-table-column prop="notifyInfo"
                         :label="$t('Withdrawal.notifyInfo')"
                         align="center"
                         min-width="165%">
          <template slot-scope="scope">
            {{ scope.row.notiyInfo}}
          </template>
        </el-table-column> -->
        <el-table-column :label="$t('People.action')"
                         align="center"
                         min-width="180%">
          <template slot-scope="scope">
            <el-button @click="handleAgree( scope.row)"
                       :disabled="scope.row.batch_status != 'PROCESSING'"
                       type="text">
              {{ $t("Withdrawal.agree") }}
            </el-button>
            <!-- <el-button @click="handleRejust( scope.row)"
                       type="text">
              {{ $t("Withdrawal.rejuest") }}
            </el-button> -->
            <!-- <el-button v-if="scope.row.lastPayDate"
                       @click="handleOrders( scope.row)"
                       type="text">
              {{ $t("People.Vieworders") }}
            </el-button> -->
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
    </div>

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
import { getWxUsersAndCount } from 'src/graphql/queries/people'
import {
  getDistributorWithdrawFundsAndCount,
  acceptedDistributorApplyWxIncomeTransfer,
} from 'src/graphql/queries/distributor'
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
    const allData = ref<any>([])
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
    const { mutate: acceptedMutation } = useMutation(
      acceptedDistributorApplyWxIncomeTransfer
    )
    const { mutate: getDistributorWithdrawFundsAndCountMutation } = useMutation(
      getDistributorWithdrawFundsAndCount
    )
    const total = ref(0)
    const getTableData = async () => {
      try {
        Loading.value = true
        const res = await getDistributorWithdrawFundsAndCountMutation({
          take: pageSize.value,
          skip: (currentPage.value - 1) * pageSize.value,
        } as any)
        if (res) {
          allData.value = res.data.getDistributorWithdrawFundsAndCount.data
          tableData.value = res.data.getDistributorWithdrawFundsAndCount.data
          total.value = res.data.getDistributorWithdrawFundsAndCount.totalCount
          Loading.value = false
          console.log(tableData.value)
        }
      } catch (error) {
        console.log('----------getPeople error')
      }
    }
    const handleAgree = async (row) => {
      Dialog.create({
        title: root.$t('People.confirm') as any,
        message: root.$t('Account.WithdrawalInfo') as any,
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
          const res = await acceptedMutation({
            id: row.id,
          } as any)
          notify.success(root.$t('notify.Done'))
          getTableData()
        } catch (error) {
          notify.error(error.message)
        }
      })
    }
    const handleRejust = async () => {}
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
    const searchValue = ref<any>('')
    const handleInputSearch = () => {
      getTableData()
    }
    onMounted(() => {
      getTableData()
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
      getTableData()
    }
    // 当前页改变
    const handleCurrentChange = (val) => {
      currentPage.value = val
      getTableData()
    }
    return {
      currentPage,
      pageSize,
      handleSizeChange,
      handleCurrentChange,
      searchValue,
      handleInputSearch,
      formatterTime,
      forateTime,
      total,
      dialogFormVisible,
      tableData,
      handleState,
      isPay,
      Loading,
      handleEcording,
      handleAgree,
      handleRejust,
      handleOrders,
    }
  },
})
</script>
<style scoped>
</style>
<style scoped>
</style>

