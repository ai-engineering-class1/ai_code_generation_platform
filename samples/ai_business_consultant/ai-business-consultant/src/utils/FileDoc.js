import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import JSZipUtils from 'jszip-utils'
import { saveAs } from 'file-saver'

/**
 4. 导出docx
 5. @param { String } tempDocxPath 模板文件路径
 6. @param { Object } data 文件中传入的数据
 7. @param { String } fileName 导出文件名称
*/
export const exportDocx = (tempDocxPath, data, fileName) => {
    // 读取并获得模板文件的二进制内容
    JSZipUtils.getBinaryContent(tempDocxPath, (error, content) => {

        if (error) {
            throw error
        }
        const zip = new PizZip(content)
        const doc = new Docxtemplater().loadZip(zip)
        console.log(doc)
        doc.setData(data)
        try {
            // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
            doc.render()
        } catch (error) {
            const e = {
                message: error.message,
                name: error.name,
                stack: error.stack,
                properties: error.properties
            }
            console.log({
                error: e
            })
            // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
            throw error
        }
        const out = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }) // Output the document using Data-URI
        saveAs(out, fileName)
    })
}