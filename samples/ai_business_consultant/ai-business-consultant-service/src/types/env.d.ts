declare namespace NodeJS {
  export interface ProcessEnv {
    DB_HOST: string;
    DB_PORT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DATABASE: string;
    DB_TEST_DATABASE: string;
    JWT_SECRET: string;
    NODE_ENV: string;
    SENTRY_DSN: string;
    REDIS_URL: string;
    WECHAT_AppID: string;
    WECHAT_AppSecret: string;
    STS_CONFIG: string;
    ZPKEY: string;
    API_URL: string;
    OSS_CONFIG: string;
    QWENKEY: string;
    WECHAT_MCHID: string;
    WECHAT_SERIAL_NO: string;
    WECHAT_PUBLIC_KEY: string;
    WECHAT_AppV3: string;
    WECHAT_H5: string;
    API_SUBDOMAIN: string;
    WEBCONSOLE_SUBDOMAIN: string;
    OSS_FILE: string;
    OSS_APIVERSION: string;
    OSS_ENDPOINT: string;
    WX_TEMPLATE_ID2: string;
    WX_TEMPLATE_ID8: string;
    QWENKEY_PROXY: string;
    GPT_PROXY: string;
    WX_OFFICIAL_ACCOUNT_CALLBACK_TOKEN: string;
    ALICLOUD_SMS_CONFIG: string;
    MINI_WECHAT_AppID: string;
    MINI_WECHAT_AppSecret: string;
    ALICLOUD_PUSH_PAPERWORK_SMS_CONFIG: string;
    QWENKEY_25_32B: string;
    HOST_URL: string;
    EMAIL_REGION: string;
    PERPLEXITY_APIKEY: string;
    OPENAI_KEY: string;
  }
}
