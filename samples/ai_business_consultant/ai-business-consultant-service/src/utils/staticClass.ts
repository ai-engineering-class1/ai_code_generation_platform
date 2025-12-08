import OSS from "ali-oss";
import redis from "ioredis";
import AsyncLock from "async-lock";
// import uuid from "uuid";
export class OSSmanager {
  private static instance: OSS | null = null;
  public static getInstance(): OSS {
    if (!this.instance) {
      const ossConfig = process.env.OSS_CONFIG;
      if (!ossConfig || ossConfig === 'undefined' || ossConfig.trim() === '') {
        throw new Error('OSS_CONFIG is not configured. Please set OSS_CONFIG in .env file with valid credentials. OSS features are disabled.');
      }
      let config;
      try {
        config = JSON.parse(ossConfig);
      } catch (e: any) {
        throw new Error(`OSS_CONFIG is not valid JSON: ${e?.message || String(e)}`);
      }
      if (!config.accessKeyId || config.accessKeyId === '' || !config.accessKeySecret || config.accessKeySecret === '') {
        throw new Error('OSS accessKeyId and accessKeySecret are required. Please configure OSS_CONFIG in .env file with valid credentials. OSS features are disabled.');
      }
      this.instance = new OSS(config);
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
  private static instance: redis | null = null;
  private static isInitialized = false;
  
  public static getInstance(): redis | null {
    // If Redis URL is not provided, return null
    if (!process.env.REDIS_URL || process.env.REDIS_URL.trim() === '') {
      if (!this.isInitialized) {
        console.warn('REDIS_URL is not configured. Redis features will be disabled.');
        this.isInitialized = true;
      }
      return null;
    }
    
    if (!this.instance) {
      try {
        // Create Redis instance with retry strategy and lazy connect
        // This prevents immediate connection attempts and allows us to set up error handlers first
        this.instance = new redis(process.env.REDIS_URL, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true, // Don't connect immediately
        });
        
        // Add error handlers - these will catch errors even if connection happens later
        this.instance.on('error', (err) => {
          console.error('[Redis] Connection error:', err.message);
          // Don't throw - just log the error to prevent unhandled errors
        });
        
        this.instance.on('connect', () => {
          console.log('[Redis] Connecting...');
        });
        
        this.instance.on('ready', () => {
          console.log('[Redis] Connection ready');
        });
        
        this.instance.on('close', () => {
          console.log('[Redis] Connection closed');
        });
        
        this.instance.on('reconnecting', () => {
          console.log('[Redis] Reconnecting...');
        });
        
        // With lazyConnect: true, connection happens automatically on first command
        // Error handlers are already in place to catch any connection errors
        
        this.isInitialized = true;
      } catch (error: any) {
        console.error('[Redis] Failed to initialize:', error?.message || String(error));
        this.instance = null;
        this.isInitialized = true;
      }
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
