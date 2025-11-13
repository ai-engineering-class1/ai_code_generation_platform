import CryptoJS from "crypto-js";
import crypto from "crypto";
import path from "path";

const ckey = "6D8SofmOXoS9tWgv";
const civ = "FZijY5p6PRkvTfNK;";
export const webHookDecrypt = (ciphertext: string): string => {
  const key = CryptoJS.enc.Utf8.parse(ckey);
  const iv = CryptoJS.enc.Utf8.parse(civ);
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
};

export const encrypted = (content: string): string => {
  try {
    const key = CryptoJS.enc.Utf8.parse(ckey);
    const iv = CryptoJS.enc.Utf8.parse(civ);
    const encrypted = CryptoJS.AES.encrypt(content, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  } catch (error) {
    return "";
  }
};

export const wxResourceDecrypt = (
  nonce: string,
  ciphertext: string,
  additionalData: string
): string => {
  const AUTH_KEY_LENGTH = 16;
  const key_bytes = Buffer.from(process.env.WECHAT_AppV3, "utf8");
  const nonce_bytes = Buffer.from(nonce, "utf8");
  // 填充内容
  const associated_data_bytes = Buffer.from(additionalData, "utf8");
  // 密文Buffer
  const ciphertext_bytes = Buffer.from(ciphertext, "base64");
  // 计算减去16位长度
  const cipherdata_length = ciphertext_bytes.length - AUTH_KEY_LENGTH;
  // upodata
  const cipherdata_bytes = ciphertext_bytes.slice(0, cipherdata_length);
  // tag
  const auth_tag_bytes = ciphertext_bytes.slice(
    cipherdata_length,
    ciphertext_bytes.length
  );
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key_bytes,
    nonce_bytes
  );
  decipher.setAuthTag(auth_tag_bytes);
  decipher.setAAD(Buffer.from(associated_data_bytes));

  const output = Buffer.concat([
    decipher.update(cipherdata_bytes),
    decipher.final(),
  ]);
  return output.toString();
};

export const encryptedName = (name: string): string => {
  const crypto = require("crypto");
  const fs = require("fs");

  // 从文件中读取公钥 (假设公钥存储在 public_key.pem 文件中)
  // const publicKey = process.env.WECHAT_SERIAL_NO; //fs.readFileSync("public_key.pem", "utf8");
  const filePath = path.join(process.cwd(), "certificate/public_key.pem");
  const publicKey = fs.readFileSync(filePath, "utf-8");
  // 要加密的敏感信息
  const sensitiveData = name; //"This is some sensitive information";

  // 使用 RSAES-OAEP 填充方案进行加密
  const encryptedData = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      // oaepHash: "sha256", // 使用 SHA-256 作为 OAEP 的哈希函数
    },
    Buffer.from(sensitiveData)
  );

  // 将加密后的数据输出为 Base64 格式（或者其他格式）
  const encryptedBase64 = encryptedData.toString("base64");
  console.log("Encrypted data (Base64):", encryptedBase64);
  return encryptedBase64;
};
