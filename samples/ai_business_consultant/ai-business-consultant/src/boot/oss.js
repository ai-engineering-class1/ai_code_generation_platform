
import { v4 as uuidv4 } from 'uuid'
import { getOssCOnfig } from 'src/graphql/queries/auth'

const OSS = require('ali-oss')
import { getOSSConfig } from 'src/graphql/queries/shareFile'
import { decrypted } from "src/utils/projectUtils";


const OSSConfig = {
    uploadHost: 'https://file.sflow.pro',
    ossParams: {
        region: 'oss-us-west-1',
        success_action_status: '200',
        accessKeyId: '',
        accessKeySecret: '',
        bucket: 'sflow-repo-us',
        endpoint: 'https://file.sflow.pro',
        cname: true,
    },
}

// oss私有捅配置
const OSSSignConfig = {
    uploadHost: 'https://sandbox.sflow.pro',
    ossParams: {
        region: 'oss-cn-hangzhou',
        success_action_status: '200',
        accessKeyId: '',
        accessKeySecret: '',
        bucket: 'sflow-sandbox',
        endpoint: 'https://sandbox.sflow.pro',
        cname: true,
    },
}

//正常的上传文件  public性质
function uploadOSS (file) {
    return new Promise(async (resolve, reject) => {

        const result = await getOssCOnfig()
        const config = JSON.parse('{' + result + "}")
        const accessKeyId = config.AccessKeyId
        const accessKeySecret = config.AccessKeySecret
        const stsToken = config.SecurityToken

        const suffix = file.name.substring(file.name.lastIndexOf('.'))
        const fileN = file.name.slice(0, file.name.lastIndexOf('.'))
        const uuid = uuidv4().toString().replaceAll('-', '')
        const fileName =
            uuid.substring(0, 1) +
            '/' +
            uuid.substring(1, 2) +
            '/' +
            uuid.substring(2) +
            suffix.replace(/\s*/g, '').replace('+', '')
        let client = new OSS({
            region: OSSConfig.ossParams.region,
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret,
            stsToken: stsToken,
            bucket: OSSConfig.ossParams.bucket,
        })

        const res = await client.multipartUpload(fileName, file)

        resolve({
            fileUrl: `${OSSConfig.uploadHost}/${fileName}`,
            fileName: fileName,
            Name: file.name,
        })
    })
}

//上传的文件变为私有文件  private性质
function uploadOSSPrivate (file) {
    return new Promise(async (resolve, reject) => {
        let vendor = 'ali'
        const result = await getOssCOnfig(vendor)
        const config = JSON.parse('{' + result + "}")
        const accessKeyId = config.AccessKeyId
        const accessKeySecret = config.AccessKeySecret
        const stsToken = config.SecurityToken

        const suffix = file.name.substring(file.name.lastIndexOf('.'))
        const fileN = file.name.slice(0, file.name.lastIndexOf('.'))
        const uuid = uuidv4().toString().replaceAll('-', '')
        const fileName =
            uuid.substring(0, 1) +
            '/' +
            uuid.substring(1, 2) +
            '/' +
            uuid.substring(2) +
            suffix.replace(/\s*/g, '').replace('+', '')
        let client = new OSS({
            region: OSSConfig.ossParams.region,
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret,
            stsToken: stsToken,
            bucket: OSSConfig.ossParams.bucket,
        })
        const res = await client.multipartUpload(fileName, file)
        const fileDataURL = `${OSSConfig.uploadHost}/${fileName}`
        let url = fileDataURL;
        let towUrl = url.substring(8);
        let indexs = towUrl.indexOf("/");
        resolve({
            fileUrl: `${OSSConfig.uploadHost}/${fileName}`,
            fileName: fileName,
        })
    })
}


function uploadFile (file, fileName) {
    return new Promise(async (resolve, reject) => {
        let vendor = 'ali'
        const result = await getOssCOnfig(vendor)
        const config = JSON.parse('{' + result + "}")
        const accessKeyId = config.AccessKeyId
        const accessKeySecret = config.AccessKeySecret
        const stsToken = config.SecurityToken

        let client = new OSS({
            region: OSSConfig.ossParams.region,
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret,
            stsToken: stsToken,
            bucket: OSSConfig.ossParams.bucket,
        })
        const res = await client.multipartUpload(fileName, file)
        resolve({
            fileUrl: `${OSSConfig.uploadHost}/${fileName}`,
            fileName: fileName
        })
    })

}

//私有捅的下载签名  暂时不用
function downloadPrivateOSS (fileName) {
    return new Promise(async (resolve, reject) => {
        const OSSConfigData = await getOSSConfig()
        let configData = decrypted({
            content: OSSConfigData,
        });
        const credentialsStr = JSON.parse("{" + configData + "}");
        const akId = credentialsStr.AccessKeyId;
        const akSecret = credentialsStr.AccessKeySecret;
        const stToken = credentialsStr.SecurityToken;
        let client = new OSS({
            region: OSSSignConfig.ossParams.region,
            accessKeyId: akId,
            accessKeySecret: akSecret,
            stsToken: stToken,
            bucket: OSSSignConfig.ossParams.bucket,
            cname: OSSSignConfig.ossParams.cname,
            endpoint: OSSSignConfig.ossParams.endpoint,
        });

        const rusultSign = client.signatureUrl(fileName, {
            expires: 60,
        })
        console.log(rusultSign);

        resolve({
            result: rusultSign,
        })
    })
}

//私有捅的上传  暂时不用
function uploadPrivateOSS (file) {
    return new Promise(async (resolve, reject) => {
        let vendor = 'ali'
        const result = await getOssCOnfig(vendor)
        const credentialsStr = JSON.parse('{' + result + "}")
        const akId = credentialsStr.AccessKeyId;
        const akSecret = credentialsStr.AccessKeySecret;
        const stToken = credentialsStr.SecurityToken;
        const fileName = file.name
        const suffix = fileName.substring(fileName.lastIndexOf("."));
        const uuid = uuidv4().toString().replaceAll("-", "");
        const guidName =
            uuid.substring(0, 1) +
            "/" +
            uuid.substring(1, 2) +
            "/" +
            uuid.substring(2) +
            suffix.replace(/\s*/g, "").replace("+", "");
        let client = new OSS({
            region: OSSSignConfig.ossParams.region,
            accessKeyId: akId,
            accessKeySecret: akSecret,
            stsToken: stToken,
            bucket: OSSSignConfig.ossParams.bucket,
            cname: OSSSignConfig.ossParams.cname,
            endpoint: OSSSignConfig.ossParams.endpoint,
        })
        try {
            const res = await client.put(guidName, file)
            console.log(res);
        } catch (e) {
            console.log(e);
        };
        // resolve(res)
        resolve({
            fileUrl: `${OSSSignConfig.uploadHost}/${guidName}`,
            fileName: guidName
        })
    })
}


//设置私有文件的下载签名  下载和预览都用这个
function PrivateOSS (fileName) {
    return new Promise(async (resolve, reject) => {
        let vendor = 'ali'
        const result = await getOssCOnfig(vendor)
        const credentialsStr = JSON.parse('{' + result + "}")
        const akId = credentialsStr.AccessKeyId;
        const akSecret = credentialsStr.AccessKeySecret;
        const stToken = credentialsStr.SecurityToken;
        let client = new OSS({
            region: OSSConfig.ossParams.region,
            accessKeyId: akId,
            accessKeySecret: akSecret,
            stsToken: stToken,
            bucket: OSSConfig.ossParams.bucket,
            cname: OSSConfig.ossParams.cname,
            endpoint: OSSConfig.ossParams.endpoint,
        });

        const rusultSign = client.signatureUrl(fileName, {
            expires: 60,
        })
        console.log(rusultSign);

        resolve({
            result: rusultSign,
        })
    })
}

//把文件变成私有文件  putACL
function changePrivate (objectName) {
    return new Promise(async (resolve, reject) => {
        const OSSConfigData = await getOSSConfig()
        let configData = decrypted({
            content: OSSConfigData,
        });
        const credentialsStr = JSON.parse("{" + configData + "}");
        const akId = credentialsStr.AccessKeyId;
        const akSecret = credentialsStr.AccessKeySecret;
        const stToken = credentialsStr.SecurityToken;
        let client = new OSS({
            region: OSSConfig.ossParams.region,
            accessKeyId: akId,
            accessKeySecret: akSecret,
            stsToken: stToken,
            bucket: OSSConfig.ossParams.bucket,
            cname: OSSConfig.ossParams.cname,
            endpoint: OSSConfig.ossParams.endpoint,
        });
        const result = await client.putACL(objectName, 'private');

        console.log(result);
        resolve({
            result: result,
        })
    })
}



export { uploadOSS, uploadFile, OSSConfig, downloadPrivateOSS, uploadPrivateOSS, PrivateOSS, changePrivate, uploadOSSPrivate }
