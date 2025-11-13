<template>
  <div class="w-full h-full px-12 ">

    <div>
      <el-tabs class="mx-5 my-2"
               v-model="activeName">
        <el-tab-pane :label="$t('Distributor.t1SplitRatio')"
                     v-if="!isT2"
                     name="1">
          <el-table :data="SplitRatios1"
                    style="width: 50%"
                    class="mb-5"
                    border
                    :loading="Loading"
                    :empty-text="$t('People.noData')">

            <el-table-column label="金额"
                             align="center"
                             min-width="100%">
              <template slot-scope="scope">
                <span style="margin-left: 10px;">≥{{ scope.row.amount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分成"
                             align="center"
                             min-width="100%">
              <template slot-scope="scope">
                <span style="margin-left: 10px;">{{ scope.row.splitRatio }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="isT2?$t('Distributor.SplitRatio'):$t('Distributor.t2SplitRatio')"
                     name="2">
          <el-table :data="SplitRatios2"
                    style="width: 50%"
                    class="mb-5"
                    border
                    :loading="Loading"
                    :empty-text="$t('People.noData')">

            <el-table-column label="金额"
                             align="center"
                             min-width="100%">
              <template slot-scope="scope">
                <span style="margin-left: 10px;">≥{{ scope.row.amount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分成"
                             align="center"
                             min-width="100%">
              <template slot-scope="scope">
                <span style="margin-left: 10px;">{{ scope.row.splitRatio }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="$t('Distributor.t3SplitRatio')"
                     v-if="!isT2"
                     name="3">
          <el-table :data="SplitRatios3"
                    style="width: 50%"
                    class="mb-5"
                    border
                    :loading="Loading"
                    :empty-text="$t('People.noData')">

            <el-table-column label="金额"
                             align="center"
                             min-width="100%">
              <template slot-scope="scope">
                <span style="margin-left: 10px;">≥{{ scope.row.amount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分成"
                             align="center"
                             min-width="100%">
              <template slot-scope="scope">
                <span style="margin-left: 10px;">{{ scope.row.splitRatio }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>

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
import validator from 'src/utils/validator'
import notify from 'src/boot/notify'
import { Dialog } from 'quasar'
import { getOrgDistributors } from 'src/graphql/queries/distributor'
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
    const allPeopleData = ref<any>([])
    const currentUser = computed(getters.currentUser)
    const tableData = ref<any>([])
    const { mutate: getOrgDistributorsMutation } =
      useMutation(getOrgDistributors)
    const SplitRatios1 = ref([])
    const SplitRatios2 = ref([])
    const SplitRatios3 = ref([])
    const activeName = ref('1')
    const isT2 = ref(false)
    const getDistributors = async () => {
      try {
        Loading.value = true
        const {
          data: { getOrgDistributors: result },
        } = await getOrgDistributorsMutation()
        if (result) {
          if (result[0].t1Distributor != null) {
            SplitRatios1.value = JSON.parse(
              result[0].t1Distributor.distributorSplitRatio.ratioJson
            )
            SplitRatios2.value = JSON.parse(
              result[0].t1Distributor.distributorSplitRatio2.ratioJson
            )
            SplitRatios3.value = JSON.parse(
              result[0].t1Distributor.distributorSplitRatio3.ratioJson
            )
            isT2.value = true
            activeName.value = '2'
          } else {
            SplitRatios1.value = JSON.parse(
              result[0].distributorSplitRatio.ratioJson
            )
            SplitRatios2.value = JSON.parse(
              result[0].distributorSplitRatio2.ratioJson
            )
            SplitRatios3.value = JSON.parse(
              result[0].distributorSplitRatio3.ratioJson
            )
            activeName.value = '1'
            isT2.value = false
          }
        }
        console.log(SplitRatios1.value)
        Loading.value = false
        console.log(tableData.value)
      } catch (error) {
        console.log('----------getPeople error')
      }
    }

    onMounted(() => {
      getDistributors()
    })
    return {
      tableData,
      SplitRatios1,
      SplitRatios2,
      SplitRatios3,
      Loading,
      activeName,
      isT2,
    }
  },
})
</script>
<style scoped></style>
