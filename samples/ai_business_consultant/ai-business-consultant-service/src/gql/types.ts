import { InputType, Field, ObjectType, Int, Float } from "type-graphql";
import {
  Commodity,
  LegalDocumentTemplate,
  LegalDocumentElement,
  LegalDocumentProject,
  LegalDocumentType,
  Organization,
  Paperwork,
  Sfbot,
  User,
  WxUser,
  WxPaidOrders,
  LlmTrace,
  Distributor,
  DistributorSplitRatio,
  DistributorWithdrawFunds,
  WxUserConsultQuota,
  WxUserScanDistributorRecords,
  Information,
  OrgCarouselImage,
  OrgMainImage,
  OrgModelText,
  OrgUsageExample,
  OrgLawyer,
  OrgBranch,
  UserRole,
  TargetCustomerAnalysis,
  Customer,
  DataManage,
  AiModelSetting,
  IntelligentNegotiationAssistant,
  DataAPIManage,
  SfbotCharacter,
  MailListen,
  OrgInvoice,
  MarketAnalysisReport,
  IndustryAnalysis,
  NegotiationAssistant,
  EstablishCommunication,
  AiReports,
  PromotionalLetter,
  PromotionalLetterRecord,
  CustomerRecord,
  CustomerDiscover,
  MailOutbox,
  MailInbox,
  MenuIndexContent,
  Department,
  StrategySuggestions,
  EmailApproval,
  Attachment,
  ProductPrice,
} from "@/models";
import ChatHistory from "models/ChatHistory";
import { PaginatedResponse } from "@/utils/paginated";

@InputType()
export class UserCreateInput implements Partial<User> {
  @Field()
  name: string;
  @Field()
  email: string;
  @Field()
  password: string;
  @Field({ nullable: true })
  phone: string;
  @Field({ nullable: true })
  avatarUrl: string;
  @Field()
  role: number;
  @Field({ nullable: true })
  wxUserId: string;
  @Field(() => String, { nullable: true })
  realName: string;
  @Field(() => String, { nullable: true })
  desc: string;
  @Field({ nullable: true })
  state: number;
}

@InputType()
export class AdminCreateInput implements Partial<User> {
  @Field()
  name: string;
  @Field()
  email: string;
  @Field()
  password: string;
  @Field({ nullable: true })
  phone: string;
  @Field({ nullable: true })
  avatarUrl: string;
  @Field(() => String, { nullable: true })
  desc: string;
}

@InputType()
export class UserLoginInput implements Partial<User> {
  @Field()
  email: string;
  @Field()
  password: string;
}

@InputType()
export class UserUpdateInput implements Partial<User> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  avatarUrl: string;
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  phone: string;
  @Field({ nullable: true })
  wxUserId: string;
  @Field(() => String, { nullable: true })
  realName: string;
  @Field(() => String, { nullable: true })
  desc: string;
  @Field(() => String, { nullable: true })
  title: string;
}

@InputType()
export class UserOtherInfoUpdateInput implements Partial<User> {
  @Field({ nullable: true })
  companySituation: string;
  @Field({ nullable: true })
  companyProductAndService: string;
}

@InputType()
export class AdminUserUpdateInput implements Partial<User> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  avatarUrl: string;
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  phone: string;
  @Field(() => Int, { nullable: true })
  role: number;
  @Field(() => String, { nullable: true })
  wxUserId: string;
  @Field(() => String, { nullable: true })
  password: string;
  @Field(() => String, { nullable: true })
  realName: string;
  @Field(() => String, { nullable: true })
  desc: string;
  @Field({ nullable: true })
  state: number;
  @Field(() => String, { nullable: true })
  title: string;
}

@InputType()
export class LegalDocumentProjectInput
  implements Partial<LegalDocumentProject>
{
  @Field()
  name: string;
  @Field({ nullable: true })
  desc: string;
  @Field(() => Int, { nullable: true })
  isConsult: number;
  @Field(() => Int, { nullable: true })
  trialConsultQuota: number;
}

@InputType()
export class LegalDocumentProjectUpdateInput
  implements Partial<LegalDocumentProject>
{
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  character_desc: string;
  @Field({ nullable: true })
  chatAiName: string;
  @Field({ nullable: true })
  chatAiGreeting: string;
  @Field({ nullable: true })
  model: string;
  @Field(() => Float, { nullable: true })
  temperature: number;
  @Field(() => Float, { nullable: true })
  top_p: number;
  @Field(() => Int, { nullable: true })
  max_tokens: number;
  @Field({ nullable: true })
  kbId: string;
  @Field({ nullable: true })
  charDescLaw: string;
  @Field({ nullable: true })
  charDescQos: string;
  @Field({ nullable: true })
  charDescCki: string;
  @Field({ nullable: true })
  promptKbx: string;
  @Field({ nullable: true })
  promptQos: string;
  @Field({ nullable: true })
  promptCki: string;
  @Field({ nullable: true })
  promptAsk: string;
  @Field({ nullable: true })
  chatAiPeroration: string;
  @Field({ nullable: true })
  rechargeReminder: string;
  @Field({ nullable: true })
  chatAiAvatarUrl: string;
  @Field({ nullable: true })
  prompt_doc: string;
  @Field({ nullable: true })
  reference_doc: string;
  @Field({ nullable: true })
  charDescAsk: string;
  @Field({ nullable: true })
  chardesc_doc: string;
  @Field(() => Int, { nullable: true })
  trialConsultQuota: number;
  @Field({ nullable: true })
  qrCodeUrl: string;
  @Field(() => Int, { nullable: true })
  turnsCki: number;
  @Field(() => Int, { nullable: true })
  turnsAsk: number;
  @Field({ nullable: true })
  llmCfgKbx: string;
  @Field({ nullable: true })
  llmCfgQos: string;
  @Field({ nullable: true })
  llmCfgAsk: string;
  @Field({ nullable: true })
  llmCfgDoc: string;
  @Field({ nullable: true })
  llmCfgCki: string;
  @Field({ nullable: true })
  nextCkiLabel: string;
  @Field(() => Int, { nullable: true })
  turnsRpt: number;
  @Field({ nullable: true })
  nextCkiDesc: string;
  @Field({ nullable: true })
  promptAskLast: string;
}

@InputType()
export class LegalDocumentInput implements Partial<LegalDocumentTemplate> {
  @Field()
  fileName: string;
  @Field()
  fileUrl: string;
  @Field()
  size: number;
  @Field({ nullable: true })
  error: string;
  @Field()
  legalDocumentProjectId: number;
  @Field({ nullable: true })
  legalDocumentTypeId: number;
}

@InputType()
export class LegalDocumentUpdateInput
  implements Partial<LegalDocumentTemplate>
{
  @Field({ nullable: true })
  fileName: string;
  @Field({ nullable: true })
  fileUrl: string;
  @Field({ nullable: true })
  size: number;
  @Field({ nullable: true })
  error: string;
  @Field({ nullable: true })
  legalDocumentTypeId: number;
}

@InputType()
export class LegalDocumentTypeInput implements Partial<LegalDocumentType> {
  @Field()
  name: string;
  @Field()
  legalDocumentProjectId: number;
}

@InputType()
export class LegalDocumentElementInput
  implements Partial<LegalDocumentElement>
{
  @Field()
  name: string;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  spec: string;
  @Field({ nullable: true })
  sample: string;
  @Field({ nullable: true })
  question: string;
  @Field({ nullable: true })
  questionMore: string;
  @Field()
  legalDocumentProjectId: number;
  @Field({ nullable: true })
  parentLegalDocumentElementId: number;
  @Field({ nullable: true })
  dependencyFactor: string;
  @Field({ nullable: true })
  dependencyValue: string;
  @Field({ nullable: true })
  flag: number;
  @Field({ nullable: true })
  dependencyCondOp: string;
  @Field({ nullable: true })
  promptAsk: string;
  @Field({ nullable: true })
  promptRef: string;
  @Field({ nullable: true })
  promptFig: string;
  @Field({ nullable: true })
  enableAsk: number;
  // @Field({ nullable: true })
  // prompt: string;
}

@InputType()
export class LegalDocumentElementUpdateInput
  implements Partial<LegalDocumentElement>
{
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  spec: string;
  @Field({ nullable: true })
  sample: string;
  @Field({ nullable: true })
  question: string;
  @Field({ nullable: true })
  questionMore: string;
  @Field({ nullable: true })
  dependencyFactor: string;
  @Field({ nullable: true })
  dependencyValue: string;
  @Field({ nullable: true })
  flag: number;
  @Field({ nullable: true })
  dependencyCondOp: string;
  @Field({ nullable: true })
  promptAsk: string;
  @Field({ nullable: true })
  promptRef: string;
  @Field({ nullable: true })
  promptFig: string;
  @Field({ nullable: true })
  enableAsk: number;
  // @Field({ nullable: true })
  // prompt: string;
}

@ObjectType()
export class wxPayLinkResult {
  @Field(() => Int)
  timestamp: number;
  @Field(() => String)
  nonce_str: string;
  @Field(() => String)
  paySign: string;
  @Field(() => String)
  prepay_id: string;
  @Field(() => String)
  out_trade_no: string;
}

@InputType()
export class OrganizationInput implements Partial<Organization> {
  @Field()
  name: string;
}

@InputType()
export class OrganizationUpdateInput implements Partial<Organization> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  sharedTitle: string;
  @Field({ nullable: true })
  sharedDescription: string;
  @Field({ nullable: true })
  sharedImageUrl: string;
  @Field({ nullable: true })
  carouselImages: string;
  @Field({ nullable: true })
  mainImages: string;
  @Field({ nullable: true })
  modelText: string;
  @Field({ nullable: true })
  usageExamples: string;
  @Field({ nullable: true })
  lawyers: string;
  @Field({ nullable: true })
  miniMsgReply: string;
  @Field({ nullable: true })
  miniSubscriptionReply: string;
  @Field({ nullable: true })
  website: string;
  @Field({ nullable: true })
  description: string;
}

@InputType()
export class SfbotCreateInput implements Partial<Sfbot> {
  @Field()
  password: string;
  @Field({ nullable: true })
  character_desc: string;
  @Field()
  chatAiName: string;
  @Field()
  chatAiGreeting: string;
  @Field({ nullable: true })
  model: string;
  @Field(() => Float, { nullable: true })
  temperature: number;
  @Field(() => Float, { nullable: true })
  top_p: number;
  @Field(() => Int, { nullable: true })
  max_tokens: number;
  @Field({ nullable: true })
  kbId: string;
  @Field({ nullable: true })
  charDescLaw: string;
  @Field({ nullable: true })
  charDescQos: string;
  @Field({ nullable: true })
  charDescCki: string;
  @Field({ nullable: true })
  promptKbx: string;
  @Field({ nullable: true })
  promptQos: string;
  @Field({ nullable: true })
  promptCki: string;
  @Field({ nullable: true })
  promptAsk: string;
  @Field({ nullable: true })
  chatAiPeroration: string;
  @Field({ nullable: true })
  rechargeReminder: string;
  @Field({ nullable: true })
  chatAiAvatarUrl: string;
}

@InputType()
export class SfbotUpdateInput implements Partial<Sfbot> {
  @Field({ nullable: true })
  password: string;
  @Field({ nullable: true })
  character_desc: string;
  @Field({ nullable: true })
  chatAiName: string;
  @Field({ nullable: true })
  chatAiGreeting: string;
  @Field({ nullable: true })
  model: string;
  @Field(() => Float, { nullable: true })
  temperature: number;
  @Field(() => Float, { nullable: true })
  top_p: number;
  @Field(() => Int, { nullable: true })
  max_tokens: number;
  @Field({ nullable: true })
  kbId: string;
  @Field({ nullable: true })
  charDescLaw: string;
  @Field({ nullable: true })
  charDescQos: string;
  @Field({ nullable: true })
  charDescCki: string;
  @Field({ nullable: true })
  promptKbx: string;
  @Field({ nullable: true })
  promptQos: string;
  @Field({ nullable: true })
  promptCki: string;
  @Field({ nullable: true })
  promptAsk: string;
  @Field({ nullable: true })
  chatAiPeroration: string;
  @Field({ nullable: true })
  rechargeReminder: string;
  @Field({ nullable: true })
  chatAiAvatarUrl: string;
}

@InputType()
export class CommodityInput implements Partial<Commodity> {
  @Field()
  name: string;
  @Field(() => Int, { nullable: true })
  legalDocumentProjectId: number | null;
  @Field()
  price: number;
  @Field({ nullable: true })
  mainImg: string;
  @Field({ nullable: true })
  description: string;
  @Field({ nullable: true })
  details: string;
  @Field({ nullable: true })
  marketPrice: number;
  @Field({ nullable: true })
  carouselImgs: string;
  @Field({ nullable: true })
  detailImgs: string;
  @Field({ nullable: true })
  stock: number;
  @Field({ nullable: true })
  state: string;
  @Field(() => Int, { nullable: true })
  validDays: number;
  @Field({ nullable: true })
  distributorStatus: string;
  // @Field(() => Int, { nullable: true })
  // checkFlag: number;
}

@InputType()
export class PaperworkInput implements Partial<Paperwork> {
  @Field()
  wxUserId: string;
  @Field()
  legalDocumentProjectId: number;
}

@InputType()
export class PaperworkUpdateInput implements Partial<Paperwork> {
  @Field()
  reviewDocJson: string;
}

@InputType()
export class ChatHistoryInput implements Partial<ChatHistory> {
  @Field()
  openid: string;
  @Field()
  state: string;
  @Field()
  message: string;
}

@InputType()
export class PaperworkSaveInput implements Partial<Paperwork> {
  @Field()
  chatJson: string;
  @Field()
  dataJson: string;
  @Field()
  docJson: string;
  @Field()
  uuid: string;
}

@ObjectType()
export class UserResult {
  @Field(() => [User])
  data: User[];
  @Field(() => Int)
  totalCount: number;
}

@ObjectType()
export class WxUserResult {
  @Field(() => [WxUser])
  data: WxUser[];
  @Field(() => Int)
  totalCount: number;
}

@ObjectType()
export class SfbotResult {
  @Field(() => [Sfbot])
  data: Sfbot[];
  @Field(() => Int)
  totalCount: number;
}

@ObjectType()
export class WxPaidOrdersResult {
  @Field(() => [WxPaidOrders])
  data: WxPaidOrders[];
  @Field(() => Int)
  totalCount: number;
}

@ObjectType()
export class PaperworkResult {
  @Field(() => [Paperwork])
  data: Paperwork[];
  @Field(() => Int)
  totalCount: number;
}

@ObjectType()
export class LlmTraceResult {
  @Field(() => [LlmTrace])
  data: LlmTrace[];
  @Field(() => Int)
  totalCount: number;
}

@InputType()
export class DistributorInput implements Partial<Distributor> {
  @Field()
  name: string;
  @Field({ nullable: true })
  desc: string;
  @Field(() => Int)
  distributorSplitRatioId: number;
  @Field(() => Int)
  distributorSplitRatio2Id: number;
  @Field(() => Int, { nullable: true })
  distributorSplitRatio3Id: number;
}

@InputType()
export class DistributorUpdateInput implements Partial<Distributor> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  desc: string;
  @Field(() => Int, { nullable: true })
  distributorSplitRatioId: number;
  @Field(() => Int, { nullable: true })
  distributorSplitRatio2Id: number;
  @Field(() => Int, { nullable: true })
  distributorSplitRatio3Id: number;
}

@InputType()
export class DistributorSplitRatioInput
  implements Partial<DistributorSplitRatio>
{
  @Field()
  name: string;
  @Field()
  ratioJson: string;
}

@InputType()
export class UserCreateAsDistributorInput implements Partial<User> {
  @Field()
  name: string;
  @Field()
  email: string;
  @Field()
  password: string;
  @Field()
  phone: string;
  @Field({ nullable: true })
  avatarUrl: string;
  @Field(() => String, { nullable: true })
  realName: string;
  @Field({ nullable: true })
  desc: string;
}

@ObjectType()
export class DistributorResult {
  @Field(() => [Distributor])
  data: Distributor[];
  @Field(() => Int)
  totalCount: number;
}

@ObjectType()
export class DistributorWithdrawFundsResult {
  @Field(() => [DistributorWithdrawFunds])
  data: DistributorWithdrawFunds[];
  @Field(() => Int)
  totalCount: number;
}

@InputType()
export class LlmTraceUpdateInput implements Partial<LlmTrace> {
  @Field(() => Int, { nullable: true })
  solved: number;
}

@ObjectType()
export class ProjectAndConsultQuotasResult {
  @Field(() => LegalDocumentProject)
  project: LegalDocumentProject;
  @Field(() => WxUserConsultQuota, { nullable: true })
  consultQuotas: WxUserConsultQuota;
}

@ObjectType()
export class WxUserScanDistributorRecordsResult {
  @Field(() => [WxUserScanDistributorRecords])
  data: WxUserScanDistributorRecords[];
  @Field(() => Int)
  totalCount: number;
}

@InputType()
export class InformationInput implements Partial<Information> {
  @Field()
  name: string;
  @Field({ nullable: true })
  content: string;
}

@InputType()
export class OrgCarouselImageInput implements Partial<OrgCarouselImage> {
  @Field({ nullable: true })
  imageUrl: string;
  @Field({ nullable: true })
  detailUrl: string;
  @Field({ nullable: true })
  title: string;
  @Field({ nullable: true })
  desc: string;
}

@InputType()
export class OrgMainImageInput implements Partial<OrgMainImage> {
  @Field({ nullable: true })
  imageUrl: string;
  @Field({ nullable: true })
  detailUrl: string;
  @Field({ nullable: true })
  title: string;
  @Field({ nullable: true })
  desc: string;
}

@InputType()
export class OrgModelTextInput implements Partial<OrgModelText> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  downloadUrl: string;
  @Field({ nullable: true })
  title: string;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  type: string;
}

@InputType()
export class OrgUsageExampleInput implements Partial<OrgUsageExample> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  imageUrl: string;
  @Field({ nullable: true })
  detailUrl: string;
  @Field({ nullable: true })
  title: string;
  @Field({ nullable: true })
  desc: string;
}

@InputType()
export class OrgLawyerInput implements Partial<OrgLawyer> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  avatarUrl: string;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  enterpriseWeChatQRCode: string;
  @Field({ nullable: true })
  lawyerQRCode: string;
}

@InputType()
export class OrgBranchInput implements Partial<OrgBranch> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  address: string;
  @Field({ nullable: true })
  phone: string;
}

@InputType()
export class UserRoleInput implements Partial<UserRole> {
  @Field()
  name: string;
  @Field({ nullable: true })
  industry: string;
  @Field({ nullable: true })
  market: string;
  @Field({ nullable: true })
  assistant: string;
  @Field({ nullable: true })
  data: string;
  @Field({ nullable: true })
  team: string;
  @Field({ nullable: true })
  devHistory: string;
  @Field({ nullable: true })
  createDate: string;
  @Field({ nullable: true })
  registeredCapital: string;
  @Field({ nullable: true })
  companyType: string;
  @Field({ nullable: true })
  business: string;
  @Field({ nullable: true })
  website: string;
  @Field({ nullable: true })
  address: string;
  @Field({ nullable: true })
  service: string;
}

@InputType()
export class ImportTargetCustomerAnalysisInput {
  @Field(() => [TargetCustomerAnalysisInput])
  data: TargetCustomerAnalysisInput[];
}

@InputType()
export class TargetCustomerAnalysisInput
  implements Partial<TargetCustomerAnalysis>
{
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  industryType: string;
  @Field({ nullable: true })
  enterpriseScale: string;
  @Field({ nullable: true })
  score: number;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  tips: string;
  @Field({ nullable: true })
  devHistory: string;
  @Field({ nullable: true })
  createDate: string;
  @Field({ nullable: true })
  registeredCapital: string;
  @Field({ nullable: true })
  companyType: string;
  @Field({ nullable: true })
  business: string;
  @Field({ nullable: true })
  website: string;
  @Field({ nullable: true })
  address: string;
  @Field({ nullable: true })
  service: string;
  @Field({ nullable: true })
  aiAdvice: string;
  @Field({ nullable: true })
  employees: string;
  @Field({ nullable: true })
  city: string;
  @Field({ nullable: true })
  dealRate: number;
  @Field({ nullable: true })
  matchlRate: number;
  @Field({ nullable: true })
  activeRate: number;
  @Field({ nullable: true })
  contactInfo: string;
  @Field({ nullable: true })
  interactiveHistory: string;
  @Field({ nullable: true })
  partnership: string;
  @Field({ nullable: true })
  customerType: string;
  @Field({ nullable: true })
  replyStatus: string;
  @Field({ nullable: true })
  revenue: number;
  @Field({ nullable: true })
  createDateStr: string;
  @Field({ nullable: true })
  emailTemplate: string;
  @Field({ nullable: true })
  emailTemplateEN: string;
  @Field({ nullable: true })
  emailTemplateCN: string;
  @Field({ nullable: true })
  companySituation: string;
  @Field({ nullable: true })
  companyProductAndService: string;
}

@InputType()
export class CustomerInput implements Partial<Customer> {
  @Field()
  name: string;
  @Field({ nullable: true })
  industryType: string;
  @Field({ nullable: true })
  enterpriseScale: string;
  @Field({ nullable: true })
  revenue: number;
  @Field({ nullable: true })
  address: string;
  @Field({ nullable: true })
  createDateStr: string;
  @Field({ nullable: true })
  website: string;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  contacts: string;
  @Field({ nullable: true })
  partnership: string;
  @Field({ nullable: true })
  AIanalysis: string;
  @Field({ nullable: true })
  risk: number;
  @Field({ nullable: true })
  cooperationValue: number;
  @Field({ nullable: true })
  priority: number;
  @Field({ nullable: true })
  isCooperate: number;
  @Field({ nullable: true })
  cooperateType: string;
  @Field({ nullable: true })
  activeHistory: string;
  @Field({ nullable: true })
  maintenancePlan: string;
  @Field({ nullable: true })
  relationshipAnalysis: string;
  @Field({ nullable: true })
  AIAlert: string;
  @Field({ nullable: true })
  sendMonthlyReport: string;
  @Field({ nullable: true })
  returnVisit: string;
  @Field({ nullable: true })
  newProductRecommendation: string;
  @Field({ nullable: true })
  recentContactTime: Date;
  @Field({ nullable: true })
  partnerStartTime: Date;
  @Field({ nullable: true })
  AIRelationshipAdvice: string;
}

@InputType()
export class DataManageInput implements Partial<DataManage> {
  @Field()
  name: string;
  @Field()
  type: string;
  @Field()
  supplier: string;
  @Field()
  updateRate: number;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  apiKey: string;
  @Field({ nullable: true })
  api: string;
}

@InputType()
export class DataManageUpdateInput implements Partial<DataManage> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  type: string;
  @Field({ nullable: true })
  supplier: string;
  @Field({ nullable: true })
  updateRate: number;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  apiKey: string;
  @Field({ nullable: true })
  api: string;
}

@InputType()
export class AiModelSettingInput implements Partial<AiModelSetting> {
  @Field()
  name: string;
  @Field()
  coefficient: string;
  @Field()
  randomParam: string;
  @Field()
  responseTime: number;
}

@InputType()
export class AiModelSettingUpdateInput implements Partial<AiModelSetting> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  coefficient: string;
  @Field({ nullable: true })
  randomParam: string;
  @Field({ nullable: true })
  responseTime: number;
}

@InputType()
export class IntelligentNegotiationAssistantInput
  implements Partial<IntelligentNegotiationAssistant>
{
  @Field()
  name: string;
  @Field()
  successRate: number;
  @Field()
  progress: number;
  @Field()
  customerInterest: number;
  @Field({ nullable: true })
  negotiationStrategy: string;
  @Field({ nullable: true })
  assistedCommunication: string;
  @Field({ nullable: true })
  customerInformationAnalysis: string;
  @Field({ nullable: true })
  productCustomization: string;
  @Field({ nullable: true })
  priceNegotiation: string;
  @Field({ nullable: true })
  focusShift: string;
  @Field({ nullable: true })
  leaderAnalysis: string;
  @Field({ nullable: true })
  competitorSituation: string;
}

@InputType()
export class IntelligentNegotiationAssistantUpdateInput
  implements Partial<IntelligentNegotiationAssistant>
{
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  successRate: number;
  @Field({ nullable: true })
  progress: number;
  @Field({ nullable: true })
  customerInterest: number;
  @Field({ nullable: true })
  negotiationStrategy: string;
  @Field({ nullable: true })
  assistedCommunication: string;
  @Field({ nullable: true })
  customerInformationAnalysis: string;
  @Field({ nullable: true })
  productCustomization: string;
  @Field({ nullable: true })
  priceNegotiation: string;
  @Field({ nullable: true })
  focusShift: string;
  @Field({ nullable: true })
  leaderAnalysis: string;
  @Field({ nullable: true })
  competitorSituation: string;
}

@InputType()
export class DataAPIManageInput implements Partial<DataAPIManage> {
  @Field()
  name: string;
  @Field({ nullable: true })
  desc: string;
  @Field()
  billingMode: number;
}

@InputType()
export class DataAPIManageUpdateInput implements Partial<DataAPIManage> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  billingMode: number;
}

@InputType()
export class SfbotCharacterInput implements Partial<SfbotCharacter> {
  @Field(() => String)
  title: string;
  @Field(() => Int)
  sfbotId: number;
  @Field(() => String, { nullable: true })
  desc: string;
  @Field(() => String, { nullable: true })
  prompt: string;
  @Field(() => String, { nullable: true })
  icon: string;
  @Field(() => String, { nullable: true })
  state: string;
  @Field(() => String, { nullable: true })
  startersJson: string;
  @Field(() => String, { nullable: true })
  type: string;
  @Field(() => String, { nullable: true })
  premission: string;
}

@InputType()
export class SfbotCharacterUpdateInput implements Partial<SfbotCharacter> {
  @Field(() => String, { nullable: true })
  title: string;
  @Field(() => String, { nullable: true })
  desc: string;
  @Field(() => String, { nullable: true })
  prompt: string;
  @Field(() => String, { nullable: true })
  icon: string;
  @Field(() => String, { nullable: true })
  state: string;
  @Field(() => String, { nullable: true })
  startersJson: string;
  @Field(() => String, { nullable: true })
  type: string;
  @Field(() => String, { nullable: true })
  premission: string;
}

@InputType()
export class MailListenInput implements Partial<MailListen> {
  @Field(() => String)
  firstName: string;
  @Field(() => String)
  lastName: string;
  @Field(() => String)
  email: string;
  @Field(() => String)
  password: string;
  @Field(() => String)
  imapHost: string;
  @Field(() => Int)
  imapPort: number;
  @Field(() => Int)
  sfbotCharacterId: number;
  @Field(() => String)
  smtpHost: string;
  @Field(() => Int)
  smtpPort: number;
  @Field(() => String, { nullable: true })
  signiture: string;
  @Field(() => String, { nullable: true })
  bcc: string;
}

@InputType()
export class TestMailListenInput implements Partial<MailListen> {
  @Field(() => String)
  email: string;
  @Field(() => String)
  password: string;
  @Field(() => String)
  imapHost: string;
  @Field(() => Int)
  imapPort: number;
}

@InputType()
export class MailListenUpdateInput implements Partial<MailListen> {
  @Field(() => String, { nullable: true })
  firstName: string;
  @Field(() => String, { nullable: true })
  lastName: string;
  @Field(() => String, { nullable: true })
  email: string;
  @Field(() => String, { nullable: true })
  password: string;
  @Field(() => String, { nullable: true })
  imapHost: string;
  @Field(() => Int, { nullable: true })
  imapPort: number;
  @Field(() => Int, { nullable: true })
  sfbotCharacterId: number;
  @Field(() => String, { nullable: true })
  smtpHost: string;
  @Field(() => Int, { nullable: true })
  smtpPort: number;
  @Field(() => String, { nullable: true })
  signiture: string;
  @Field(() => String, { nullable: true })
  bcc: string;
}

@InputType()
export class OrgInvoiceInput implements Partial<OrgInvoice> {
  @Field()
  name: string;
  @Field()
  type: string;
  @Field()
  identificationNumber: string;
  @Field()
  address: string;
}

@InputType()
export class OrgInvoiceUpdateInput implements Partial<OrgInvoice> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  type: string;
  @Field({ nullable: true })
  identificationNumber: string;
  @Field({ nullable: true })
  address: string;
}

@ObjectType()
export class TargetCustomerAnalysisResult {
  @Field(() => [TargetCustomerAnalysis])
  result: TargetCustomerAnalysis[];
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class AiModelSettingResult {
  @Field(() => [AiModelSetting])
  result: AiModelSetting[];
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class IntelligentNegotiationAssistantResult {
  @Field(() => [IntelligentNegotiationAssistant])
  result: IntelligentNegotiationAssistant[];
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class CustomerResult {
  @Field(() => [Customer])
  result: Customer[];
  @Field(() => Int)
  total: number;
}

@InputType()
export class MarketAnalysisReportInput
  implements Partial<MarketAnalysisReport>
{
  //市场报告分析
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  desc: string;
  @Field({ nullable: true })
  indicators: string;
  @Field({ nullable: true })
  participant: string;
  //市场定位
  @Field({ nullable: true })
  SegmentedPositioningName: string;
  @Field({ nullable: true })
  SegmentedPositioning: string;
  @Field({ nullable: true })
  segmentedScenesName: string;
  @Field({ nullable: true })
  segmentedScenes: string;
  @Field({ nullable: true })
  distributionChannel: string;
  @Field({ nullable: true })
  distributionChannelAnalysis: string;
  @Field({ nullable: true })
  dataIndicators: string;
  @Field({ nullable: true })
  segmentedCustomer: string;
  @Field({ nullable: true })
  customerProfile: string;
  @Field({ nullable: true })
  customerBehavior: string;
  @Field({ nullable: true })
  AIMarketingSuggestions: string;
  @Field({ nullable: true })
  AIStrategySuggestions: string;
  @Field({ nullable: true })
  AIPriceSuggestions: string;
  @Field({ nullable: true })
  AIPriceAnalysis: string;
  @Field({ nullable: true })
  AICompetitorPriceAnalysis: string;
  @Field({ nullable: true })
  AIPriceAdjustAnalysis: string;
  //竞争策略
  @Field({ nullable: true })
  competitorStrategy: string;
  @Field({ nullable: true })
  SWOTAnalysis: string;
  //战略建议
  @Field({ nullable: true })
  marketingStrategySuggestions: string;
  @Field({ nullable: true })
  category: number;
}

@ObjectType()
export class MarketAnalysisReportResult {
  @Field(() => [MarketAnalysisReport])
  result: MarketAnalysisReport[];
  @Field(() => Int)
  total: number;
}

@InputType()
export class IndustryAnalysisInput implements Partial<IndustryAnalysis> {
  @Field()
  name: string;
  @Field()
  industry: string;
  @Field()
  childIndustry: string;
  @Field()
  dateRange: string;
  @Field({ nullable: true })
  industryHotspots: string;
  @Field({ nullable: true })
  policyImpact: string;
  @Field({ nullable: true })
  competitiveLandscape: string;
  @Field({ nullable: true })
  trackRecommendation: string;
  @Field({ nullable: true })
  feasibilityAssessment: string;
  @Field({ nullable: true })
  SWOTAnalysis: string;
  @Field({ nullable: true })
  developmentForecast: string;
  @Field({ nullable: true })
  industryUpstream: string;
  @Field({ nullable: true })
  industryMidstream: string;
  @Field({ nullable: true })
  industryDownstream: string;
  @Field({ nullable: true })
  investmentAdvice: string;
  @Field({ nullable: true })
  riskWarning: string;
}

@ObjectType()
export class IndustryAnalysisResult {
  @Field(() => [IndustryAnalysis])
  result: IndustryAnalysis[];
  @Field(() => Int)
  total: number;
}

@InputType()
export class AnalysisMarketPositioningInput {
  @Field()
  product: string;
  @Field()
  competitors: string;
  @Field()
  industry: string;
  @Field()
  area: string;
  @Field()
  price: string;
  @Field(() => [String])
  channel: string[];
  @Field()
  market: string;
  @Field()
  dateRange: string;
  @Field({ nullable: true })
  category: number;
}

@InputType()
export class AnalysisMarketInput {
  @Field()
  product: string;
  @Field()
  industry: string;
  @Field()
  area: string;
  @Field()
  dateRange: string;
  @Field({ nullable: true })
  category: number;
}

@InputType()
export class AnalysisMarketStrategyInput {
  @Field()
  product: string;
  @Field()
  industry: string;
  @Field()
  area: string;
  @Field()
  dateRange: string;
  @Field(() => [String])
  dimensions: string[];
  @Field({ nullable: true })
  category: number;
}

@InputType()
export class AnalysisMarketStrategySuggestionsInput {
  @Field()
  product: string;
  @Field()
  scale: string;
  @Field()
  market: string;
  @Field(() => [String])
  model: string[];
  @Field()
  budget: string;
  @Field(() => [String])
  strategy: string[];
  @Field({ nullable: true })
  challenge: string;
  @Field({ nullable: true })
  category: number;
}

@InputType()
export class AnalysisIndustryInput {
  @Field()
  industry: string;
  @Field()
  childIndustry: string;
  @Field()
  dateRange: string;
  @Field({ nullable: true })
  category: string;
}

@InputType()
export class NegotiationAssistantInput
  implements Partial<NegotiationAssistant>
{
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  area: string;
  @Field({ nullable: true })
  product: string;
  @Field({ nullable: true })
  target: string;
  @Field({ nullable: true })
  companyOverview: string;
  @Field({ nullable: true })
  businessModel: string;
  @Field({ nullable: true })
  transactionRecords: string;
  @Field({ nullable: true })
  cultural: string;
  @Field({ nullable: true })
  negotiationStrategies: string;
  @Field({ nullable: true })
  negotiationStrategiesDetail: string;
  @Field({ nullable: true })
  IOTrends: string;
  @Field({ nullable: true })
  tariffPolicy: string;
  @Field({ nullable: true })
  supplyChain: string;
  @Field({ nullable: true })
  negotiationText: string;
  @Field({ nullable: true })
  negotiationTextResult: string;
  @Field({ nullable: true })
  targetCustomerAnalysisId: number;
  @Field({ nullable: true })
  negotiationContent: string;
}

@ObjectType()
export class NegotiationAssistantResult {
  @Field(() => [NegotiationAssistant])
  result: NegotiationAssistant[];
  @Field(() => Int)
  total: number;
}

@InputType()
export class NegotiationPreparationInput {
  @Field()
  name: string;
  @Field()
  area: string;
  @Field()
  product: string;
  @Field()
  target: string;
}

@InputType()
export class TradeStatisticsInput {
  @Field()
  area: string;
  @Field()
  product: string;
  @Field()
  dateRange: string;
}

@InputType()
export class EstablishCommunicationInput
  implements Partial<EstablishCommunication>
{
  @Field()
  name: string;
  @Field()
  industry: string;
  @Field()
  contact: string;
  @Field({ nullable: true })
  score: number;
  @Field({ nullable: true })
  status: string;
  @Field({ nullable: true })
  emailTemplates: string;
  @Field({ nullable: true })
  communicationMethods: string;
  @Field({ nullable: true })
  recentContactTime: Date;
  @Field({ nullable: true })
  dealRate: number;
}

@InputType()
export class EstablishCommunicationUpdateInput
  implements Partial<EstablishCommunication>
{
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  industry: string;
  @Field({ nullable: true })
  contact: string;
  @Field({ nullable: true })
  score: number;
  @Field({ nullable: true })
  status: string;
  @Field({ nullable: true })
  emailTemplates: string;
  @Field({ nullable: true })
  communicationMethods: string;
  @Field({ nullable: true })
  recentContactTime: Date;
  @Field({ nullable: true })
  dealRate: number;
}

@ObjectType()
export class EstablishCommunicationResult {
  @Field(() => [EstablishCommunication])
  result: EstablishCommunication[];
  @Field(() => Int)
  total: number;
}

@InputType()
export class AiReportsInput implements Partial<AiReports> {
  @Field()
  session_id: string;
  @Field()
  session_name: string;
  @Field()
  report_url: string;
}

@ObjectType()
export class AiReportsResult {
  @Field(() => [AiReports])
  result: AiReports[];
  @Field(() => Int)
  total: number;
}

@InputType()
export class PromotionalLetterInput implements Partial<PromotionalLetter> {
  @Field()
  name: string;
  @Field({ nullable: true })
  feature: string;
  @Field({ nullable: true })
  advantage: string;
  @Field()
  industry: string;
  @Field()
  country: string;
  @Field({ nullable: true })
  size: string;
  @Field()
  emailStyle: string;
  @Field({ nullable: true })
  previewEmail: string;
  @Field({ nullable: true })
  otherDesc: string;
  @Field({ nullable: true })
  subjectEmail: string;
  @Field({ nullable: true })
  attachmentEmail: string;
  @Field({ nullable: true })
  language: string;
}

@InputType()
export class PromotionalLetterUpdateInput
  implements Partial<PromotionalLetter>
{
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  feature: string;
  @Field({ nullable: true })
  advantage: string;
  @Field({ nullable: true })
  industry: string;
  @Field({ nullable: true })
  country: string;
  @Field({ nullable: true })
  size: string;
  @Field({ nullable: true })
  emailStyle: string;
  @Field({ nullable: true })
  previewEmail: string;
  @Field({ nullable: true })
  otherDesc: string;
  @Field({ nullable: true })
  subjectEmail: string;
  @Field({ nullable: true })
  attachmentEmail: string;
  @Field({ nullable: true })
  language: string;
}

@ObjectType()
export class PromotionalLetterResult {
  @Field(() => [PromotionalLetter])
  result: PromotionalLetter[];
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class PromotionalLetterRecordResult {
  @Field(() => [PromotionalLetterRecord])
  result: PromotionalLetterRecord[];
  @Field(() => Int)
  total: number;
}

@InputType()
export class PromotionalLetterEmailInput {
  @Field(() => Int, { nullable: true })
  targetCustomerAnalysisId: number;
  @Field(() => String)
  toEmail: string;
}

@InputType()
export class PromotionalLetterEmailsInput {
  @Field(() => [PromotionalLetterEmailInput])
  models: PromotionalLetterEmailInput[];
}

@InputType()
export class CustomerRecordInput implements Partial<CustomerRecord> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  company: string;
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  product: string;
  @Field({ nullable: true })
  source: string;
  @Field({ nullable: true })
  status: string;
  @Field({ nullable: true })
  emailContent: string;
}

@ObjectType()
export class CustomerRecordResult {
  @Field(() => [CustomerRecord])
  result: CustomerRecord[];
  @Field(() => Int)
  total: number;
}

@InputType()
export class CustomerRecordUpdateInput implements Partial<CustomerRecord> {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  company: string;
  @Field({ nullable: true })
  email: string;
  @Field({ nullable: true })
  interest: string;
  @Field({ nullable: true })
  phone: string;
  @Field({ nullable: true })
  priority: string;
  @Field({ nullable: true })
  position: string;
}

@InputType()
export class CustomerDiscoverInput implements Partial<CustomerDiscover> {
  @Field(() => Int, { nullable: true })
  enableListen: number;
  @Field(() => Int)
  mailListenId: number;
  @Field({ nullable: true })
  titleFilter: string;
  @Field({ nullable: true })
  aiPrompt: string;
  @Field({ nullable: true })
  exceptEmails: string;
  @Field({ nullable: true })
  scanStartTime: Date;
  @Field({ nullable: true })
  scanEndTime: Date;
  @Field({ nullable: true })
  name: string;
}

@InputType()
export class CustomerDiscoverFromActiveInput
  implements Partial<CustomerDiscover>
{
  @Field(() => Int)
  enableListen: number;
  @Field(() => Int)
  mailListenId: number;
  @Field({ nullable: true })
  titleFilter: string;
  @Field({ nullable: true })
  aiPrompt: string;
  @Field({ nullable: true })
  exceptEmails: string;
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  specialAIPrompt: string;
  @Field({ nullable: true })
  specialField: string;
}

@InputType()
export class CustomerDiscoverFromHistoryInput
  implements Partial<CustomerDiscover>
{
  @Field(() => Int)
  mailListenId: number;
  @Field({ nullable: true })
  titleFilter: string;
  @Field({ nullable: true })
  aiPrompt: string;
  @Field({ nullable: true })
  scanStartTime: Date;
  @Field({ nullable: true })
  scanEndTime: Date;
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  specialAIPrompt: string;
  @Field({ nullable: true })
  specialField: string;
}

@ObjectType()
export class PromotionalLetterEmailResult {
  @Field(() => [MailOutbox])
  mailOutBox: MailOutbox[];
  @Field(() => [MailInbox])
  mailInBox: MailInbox[];
}

@ObjectType()
export class MailInboxResult {
  @Field(() => [MailInbox])
  result: MailInbox[];
  @Field(() => Int)
  total: number;
  @Field(() => Int, { nullable: true })
  totalUnread: number;
}

@InputType()
class SfbotsInput implements Partial<Sfbot> {
  @Field(() => Int)
  id: number;
}

@InputType()
export class MenuIndexContentInput implements Partial<MenuIndexContent> {
  @Field(() => String)
  content: string;
  @Field(() => String)
  type: string;
  @Field(() => String, { nullable: true })
  category: string;
  @Field(() => Int, { nullable: true })
  permissionFlag: number;
  @Field(() => [SfbotsInput], { nullable: true })
  sfbots: Sfbot[];
  @Field(() => Int, { nullable: true })
  sfbotCharacterId: number;
  @Field(() => Int, { nullable: true })
  parentId: number;
  @Field(() => String, { nullable: true })
  fileName: string;
}

@InputType()
export class MenuIndexContentUpdateInput implements Partial<MenuIndexContent> {
  @Field()
  content: string;
  @Field()
  type: string;
  @Field({ nullable: true })
  category: string;
  @Field({ nullable: true })
  fileName: string;
}

@ObjectType()
export class MenuIndexContentResult {
  @Field(() => [MenuIndexContent])
  result: MenuIndexContent[];
  @Field(() => Int)
  total: number;
}

@InputType()
export class DepartmentInput implements Partial<Department> {
  @Field()
  name: string;
  @Field(() => String, { nullable: true })
  description: string | null;
  @Field(() => Int)
  parentDepartmentId: number;
  @Field(() => String)
  leaderUserId: string;
  @Field(() => [String])
  departmentUsersId: string[];
}

@InputType()
export class DepartmentInputUpdate implements Partial<Department> {
  @Field({ nullable: true })
  name: string;
  @Field(() => String, { nullable: true })
  description: string | null;
  @Field(() => Int, { nullable: true })
  parentDepartmentId: number;
  @Field(() => String, { nullable: true })
  leaderUserId: string;
  @Field(() => [String], { nullable: true })
  departmentUsersId: string[];
}

@ObjectType()
export class MailOutboxResult {
  @Field(() => [MailOutbox])
  result: MailOutbox[];
  @Field(() => Int)
  total: number;
}

@ObjectType()
export class MailListenResult {
  @Field(() => [MailListen])
  result: MailListen[];
  @Field(() => Int)
  total: number;
}

@InputType()
export class StrategySuggestionsInput implements Partial<StrategySuggestions> {
  @Field()
  name: string;
  @Field(() => String, { nullable: true })
  desc: string;
}

@InputType()
export class EmailApprovalInput implements Partial<EmailApproval> {
  @Field()
  title: string;
  @Field()
  desc: string;
  @Field()
  emailContent: string;
  @Field(() => Int)
  mailListenId: number;
  @Field(() => Int)
  targetCustomerAnalysisId: number;
  @Field()
  approvalUserId: string;
}

@InputType()
export class EmailApprovalStateInput implements Partial<EmailApproval> {
  @Field()
  state: string;
  @Field()
  opinion: string;
}

@ObjectType()
export class EmailApprovalResult {
  @Field(() => [EmailApproval])
  result: EmailApproval[];
  @Field(() => Int)
  total: number;
}

//用工厂函数创建泛型类
@ObjectType()
export class TargetCustomerAnalysisssResult extends PaginatedResponse(TargetCustomerAnalysis) {}


@InputType()
export class AttachmentInput implements Partial<Attachment> {
  @Field()
  name: string;
  @Field()
  fileLocation: string;
  @Field(() => String, { nullable: true })
  description: string;
  @Field(() => String, { nullable: true })
  keywords: string;
}

@ObjectType()
export class AttachmentResult extends PaginatedResponse(Attachment) {}


@InputType()
export class ProductPriceInput implements Partial<ProductPrice> {
  @Field()
  productName: string;
  @Field(() => String, { nullable: true })
  description: string;
  @Field(() => String, { nullable: true })
  keywords: string;
  @Field()
  priceLevel: string;
  @Field(() => Int)
  priceValue: number;
  @Field(() => Int)
  quoteRatio: number;
  @Field(() => Int)
  successRate: number;
}

@ObjectType()
export class ProductPriceResult extends PaginatedResponse(ProductPrice) {}