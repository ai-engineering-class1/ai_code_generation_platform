import OSS from "ali-oss";
import redis from "ioredis";
import AsyncLock from "async-lock";
// import uuid from "uuid";
export class OSSmanager {
  private static instance: OSS;
  public static getInstance() {
    if (!this.instance) {
      this.instance = new OSS(JSON.parse(process.env.OSS_CONFIG));
    }
    return this.instance;
  }
  public static upload(name: string, buffer: any): Promise<string> {
    const uuid = require("uuid");
    return new Promise((resolve, reject) => {
      this.getInstance()
        .put(uuid.v4() + name, buffer, {
          timeout: 5000,
        })
        .then((result: OSS.PutObjectResult) => {
          return resolve(result.url);
        })
        .catch((err) => {
          reject({ err: err });
        });
    });
  }
}

export class RedisManager {
  private static instance: redis;
  public static getInstance() {
    if (!this.instance) {
      this.instance = new redis(process.env.REDIS_URL);
    }
    return this.instance;
  }
}

export class AsyncLockManager {
  private static instance: AsyncLock;
  public static getInstance() {
    if (!this.instance) {
      this.instance = new AsyncLock();
    }
    return this.instance;
  }
}
