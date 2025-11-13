<template>
  <div class="px-10 py-5">
    <el-button
      class="float-right"
      type="primary"
      style="margin-bottom: 10px"
      @click="exportToExcel"
      >{{ $t("order.export") }}</el-button
    >
    <el-table
      :data="tableData"
      style="width: 100%"
      class="mt-3 mb-5"
      border
      :empty-text="$t('People.noData')"
    >
      <el-table-column
        prop="wxUserId"
        :label="$t('order.userId')"
        align="center"
        min-width="100%"
      >
        <template slot-scope="scope">
          <div
            style="
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: left;
              margin-left: 10px;
            "
          >
            <j-avatar
              :size="28"
              :avatarUrl="scope.row.wxUser.avatarUrl"
              :name="'xxxxx'"
              class="shadow-outline-white -ml-1"
            />
            <span style="margin-left: 10px">{{ scope.row.wxUser.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="out_trade_no"
        :label="$t('order.orderNO')"
        align="center"
        min-width="100%"
      >
      </el-table-column>
      <el-table-column
        prop="goodsname"
        :label="$t('order.goodsName')"
        align="center"
        min-width="100%"
      >
        <template slot-scope="scope">
          {{ scope.row.commodity.name }}
        </template>
      </el-table-column>
      <el-table-column
        prop="createdAt"
        :label="$t('order.createdAt')"
        align="center"
        min-width="100%"
      >
        <template slot-scope="scope">
          {{ format(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="state"
        :label="$t('order.status')"
        align="center"
        min-width="100%"
      >
        <template slot-scope="scope">
          {{ handleState(scope.row.state) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="total"
        :label="$t('order.total')"
        align="center"
        min-width="100%"
      >
        <template slot-scope="scope">
          {{ scope.row.total == 0 ? "-" : scope.row.total / 100 }}
        </template>
      </el-table-column>
      <el-table-column
        prop="total"
        :label="$t('order.PrimaryDistributor')"
        align="center"
        v-if="
          !(currentUser.role == 5 && currentUser.distributor.t1DistributorId)
        "
        min-width="100%"
      >
        <template slot-scope="scope">
          {{
            scope.row.wxUser.distributor
              ? scope.row.wxUser.distributor.t1Distributor != null
                ? scope.row.wxUser.distributor.t1Distributor.name
                : scope.row.wxUser.distributor.name
              : "-"
          }}
        </template>
      </el-table-column>
      <el-table-column
        prop="total"
        :label="$t('order.SecondaryDistributors')"
        align="center"
        min-width="100%"
      >
        <template slot-scope="scope">
          {{
            scope.row.wxUser.distributor
              ? scope.row.wxUser.distributor.t1Distributor
                ? scope.row.wxUser.distributor.name
                : "-"
              : "-"
          }}
        </template>
      </el-table-column>
      <el-table-column
        prop="total"
        :label="$t('order.T1Divide')"
        align="center"
        v-if="
          !(currentUser.role == 5 && currentUser.distributor.t1DistributorId)
        "
        min-width="100%"
      >
        <template slot-scope="scope">
          {{ scope.row.t1_share == 0 ? "-" : scope.row.t1_share / 10000 }}
        </template>
      </el-table-column>
      <el-table-column
        prop="total"
        :label="
          !(currentUser.role == 5 && currentUser.distributor.t1DistributorId)
            ? $t('order.T2Divide')
            : $t('order.Divide')
        "
        align="center"
        min-width="100%"
      >
        <template slot-scope="scope">
          {{ scope.row.t2_share == 0 ? "-" : scope.row.t2_share / 10000 }}
        </template>
      </el-table-column>
      <!-- <el-table-column :label="$t('People.action')"
                       align="center"
                       min-width="180%">
        <template slot-scope="scope">
          <el-button @click="handleDetail( scope.row)"
                     type="text">
            {{ $t("kb.Detail") }}
          </el-button>

        </template>
      </el-table-column> -->
    </el-table>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[5, 10, 20, 50]"
      :page-size="pageSize"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
    >
    </el-pagination>
  </div>
</template>

<script>
import {
  defineComponent,
  ref,
  onMounted,
  computed,
  reactive,
} from "@vue/composition-api";
import validator from "src/utils/validator";
import { useMutation } from "@vue/apollo-composable";
import {
  getWxPaidOrders,
  getWxPaidOrdersAndCount,
} from "src/graphql/queries/order";
import { storeAuthToken } from "src/utils/authToken";
import notify from "src/boot/notify";
import store from "src/store/store";
import dayjs from "dayjs";
import { uploadOSS, OSSConfig } from "src/boot/oss";
import { getters, mutations } from "../store/store";
import * as XLSX from "xlsx";
import FileSaver from "file-saver";
import {
  getIsMobileBrowser,
  watchIsMobileBrowser,
} from "src/utils/isMobileBrowser";
export default defineComponent({
  name: "Login",
  data() {
    return {
      //   currentPage: 1, // 当前页
      //   pageSize: 10, // 每页显示条数
    };
  },
  mounted() {
    watchIsMobileBrowser(this, "isMobile");
  },
  setup(props, { root }) {
    const currentPage = ref(1); // 当前页
    const pageSize = ref(10); // 每页显示条数
    const total = ref(0);
    const currentUser = computed(getters.currentUser);
    const { mutate: WxPaidOrdersMutation } = useMutation(getWxPaidOrders);
    const { mutate: getWxPaidOrdersAndCountMutation } = useMutation(
      getWxPaidOrdersAndCount
    );
    const tableData = ref([]);
    const getAllOrders = async () => {
      const res = await WxPaidOrdersMutation();
      if (res) {
        // tableData.value = res.data.getWxPaidOrders
      }
    };
    const exportToExcel = async () => {
      const res = await WxPaidOrdersMutation();
      if (res) {
        let datas = [];
        let headers = [];
        if (
          !(
            currentUser.value.role == 5 &&
            currentUser.value.distributor.t1DistributorId
          )
        ) {
          headers = [
            "用户",
            "订单号",
            "商品名称",
            "下单时间",
            "状态",
            "金额",
            "一级分销商",
            "二级分销商",
            "t1分成",
            "t2分成",
          ];
        } else {
          headers = [
            "用户",
            "订单号",
            "商品名称",
            "下单时间",
            "状态",
            "金额",
            "二级分销商",
            "分成",
          ];
        }

        const alldata = res.data.getWxPaidOrders;
        alldata.forEach((element) => {
          let item;
          if (
            !(
              currentUser.value.role == 5 &&
              currentUser.value.distributor.t1DistributorId
            )
          ) {
            item = {
              name: element.wxUser.name,
              orderId: element.out_trade_no,
              goodsname: element.commodity?.name,
              createTime: format(element.createdAt),
              state: handleState(element.state),
              amount: element.total == 0 ? "-" : element.total / 100,
              t1Distributor: element.wxUser.distributor
                ? element.wxUser.distributor.t1Distributor != null
                  ? element.wxUser.distributor.t1Distributor.name
                  : element.wxUser.distributor.name
                : "-",
              t2Distributor: element.wxUser.distributor
                ? element.wxUser.distributor.t1Distributor
                  ? element.wxUser.distributor.name
                  : "-"
                : "-",
              t1Amount: element.t1_share == 0 ? "-" : element.t1_share / 10000,
              t2Amount: element.t2_share == 0 ? "-" : element.t2_share / 10000,
            };
          } else {
            item = {
              name: element.wxUser.name,
              orderId: element.out_trade_no,
              goodsname: element.commodity?.name,
              createTime: format(element.createdAt),
              state: handleState(element.state),
              amount: element.total == 0 ? "-" : element.total / 100,
              t2Distributor: element.wxUser.distributor
                ? element.wxUser.distributor.t1Distributor
                  ? element.wxUser.distributor.name
                  : "-"
                : "-",
              t2Amount: element.t2_share == 0 ? "-" : element.t2_share / 10000,
            };
          }

          datas.push(item);
        });
        const worksheet = XLSX.utils.json_to_sheet(datas);

        // 设置表头
        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // 生成二进制数据
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });

        // 保存文件
        const blob = new Blob([excelBuffer], {
          type: "application/octet-stream",
        });
        FileSaver.saveAs(blob, "订单.xlsx");
      }
    };
    const getAllKB = async () => {
      const res = await getWxPaidOrdersAndCountMutation({
        take: pageSize.value,
        skip: (currentPage.value - 1) * pageSize.value,
      });
      if (res) {
        tableData.value = res.data.getWxPaidOrdersAndCount.data;
        total.value = res.data.getWxPaidOrdersAndCount.totalCount;
      }
    };
    const handleCurrentChange = (val) => {
      currentPage.value = val;
      getAllKB();
    };
    const handleSizeChange = (val) => {
      pageSize.value = val;
      getAllKB();
    };
    // 时间戳
    const format = (date, format = "YYYY/MM/DD  HH:mm:ss") => {
      return date ? dayjs(date).format(format) : date;
    };
    const handleManage = async () => {
      window.open("https://open.bigmodel.cn/appcenter_v1/knowledge");
    };
    const handleState = (state) => {
      switch (state) {
        case "SUCCESS":
          return "支付成功";
        case "USERPAYING":
          return "用户支付中";
        case "REFUND":
          return "转入退款";
        case "NOTPAY":
          return "未支付";
        case "CLOSED":
          return "已关闭";
        case "REFUND":
          return "转入退款";
      }
    };
    const handleDetail = async (item) => {
      window.open("https://open.bigmodel.cn/appcenter_v1/knowledge/" + item.id);
    };
    onMounted(() => {
      getAllKB();
    });
    return {
      tableData,
      handleDetail,
      format,
      total,
      currentUser,
      handleManage,
      handleCurrentChange,
      handleSizeChange,
      pageSize,
      currentPage,
      handleState,
      exportToExcel,
    };
  },
  methods: {
    // 每页显示条数改变
    // handleSizeChange(val) {
    //   this.pageSize = val
    // },
    // // 当前页改变
    // handleCurrentChange(val) {
    //   this.currentPage = val
    // },
    exportExcelTable() {
      const XLSX = require("xlsx");
      var xlsxParam = { raw: true };
      var fix = document.querySelector(".el-table__fixed");
      var exportTable;
      if (fix) {
        exportTable = XLSX.utils.table_to_book(
          document.querySelector("#out-table").removeChild(fix),
          xlsxParam
        );
        document.querySelector("#out-table").appendChild(fix);
      } else {
        exportTable = XLSX.utils.table_to_book(
          document.querySelector("#out-table"),
          xlsxParam
        );
      }

      var exportTableOut = XLSX.write(exportTable, {
        bookType: "xlsx",
        bookSST: true,
        type: "array",
      });
      try {
        FileSaver.saveAs(
          new Blob([exportTableOut], {
            type: "application/octet-stream",
          }),
          "订单.xlsx"
        );
      } catch (e) {
        if (typeof console !== "undefined") {
          console.log(e, exportTableOut);
        }
      }
      return exportTableOut;
    },
  },
});
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

