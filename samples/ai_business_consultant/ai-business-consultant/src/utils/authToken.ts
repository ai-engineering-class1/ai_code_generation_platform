import {mutations} from 'src/store/store'
export const getStoredAuthToken = () => localStorage.getItem('authToken')

export const storeAuthToken = (token: string) =>{
  localStorage.setItem('authToken', token)
  mutations.setIsAuthenticated(true)
}


export const removeStoredAuthToken = () => {
  localStorage.removeItem('authToken')
  mutations.setIsAuthenticated(false)
}
