
import { Issue } from 'src/types/issue'
import store from "src/store/store";
import { apolloClient } from "src/graphql/client";
import { Project } from "src/types/project";
import CryptoJS from 'crypto-js'

const ckey = '6D8SofmOXoS9tWgv'
const civ = 'FZijY5p6PRkvTfNK'
export const decrypted = ({ content }) => {
    try {

        const key = CryptoJS.enc.Utf8.parse(ckey)
        const iv = CryptoJS.enc.Utf8.parse(civ)
        const decrypted = CryptoJS.AES.decrypt(content, key, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        })
        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8)
        return decryptedStr.slice(1, decryptedStr.length - 1)
    } catch (error) {
        return false
    }
}

export const encrypted = ({ content }) => {
    try {
        const key = CryptoJS.enc.Utf8.parse(ckey)
        const iv = CryptoJS.enc.Utf8.parse(civ)
        const encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(content || {}),
            key,
            {
                iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            }
        )
        return encrypted.toString()
    } catch (error) {
        return false
    }
}
export class SpeechTTS {
    private instance: SpeechSynthesisUtterance;
    private speechTime;
    constructor() {
        this.instance = new window.SpeechSynthesisUtterance()
        // this.speechTime = null
    }
    speak({
        text,
        rate = 0.9,
        //lang = 'en',
        voice = window.speechSynthesis.getVoices()[0],
        pitch = 1,
        volume = 1,
        enqueue = false,
        handleEnd = () => { },
        handleStart = () => { },
        handlePause = () => { },
        handleResume = () => { }
    }) {
        clearTimeout(this.speechTime)
        this.cancel()
        this.instance.rate = rate
        this.instance.text = text
        this.instance.voice = voice
        this.instance.pitch = pitch
        this.instance.volume = volume

        speechSynthesis.speak(this.instance)
        const that = this
        this.instance.onstart = function () {
            console.log('onstart')
            handleStart()

            that.speechTime = setTimeout(() => {
                that.cancel()
            }, 1000 * 16);
        }
        this.instance.onend = function () {
            console.log('onend')
            handleEnd()
        }
        this.instance.onpause = function () {
            console.log('onpause')
            handlePause()
        }
        this.instance.onresume = function () {
            console.log('onresume ')
            handleResume()
        }
    }
    pause() {
        speechSynthesis.pause()
    }
    resume() {
        speechSynthesis.resume()
    }
    cancel() {
        speechSynthesis.cancel()
    }
    voice() {
        return speechSynthesis.getVoices();
    }
}
export default {

    decrypted,
    encrypted
};
