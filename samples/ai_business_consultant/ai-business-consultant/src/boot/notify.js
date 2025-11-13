
import {
  Notify,
} from 'quasar'

export const error = function (message) {
  Notify.create({
      spinner: false,
      type: 'negative',
      message,
  })
}

export const success = function (message) {
  Notify.create({
      spinner: false,
      type: 'positive',
      message,
  })
}

export const warning = function (message) {
  Notify.create({
      spinner: false,
      type: 'warning',
      message,
  })
}

export const info = function (message) {
  Notify.create({
      spinner: false,
      type: 'info',
      message,
  })
}

export const ongoing = function (message) {
  Notify.create({
      spinner: false,
      type: 'ongoing',
      message,
  })
}


export default {
  error,
  success,
  warning,
  info,
  ongoing,
}
