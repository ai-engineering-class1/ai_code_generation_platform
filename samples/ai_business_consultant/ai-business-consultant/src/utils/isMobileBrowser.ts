import { Platform } from 'quasar';
window.addEventListener("resize", function(){
  const windowHWInfo = {
    width: window.innerWidth,
    height: window.innerHeight,
  }
  if(windowHWInfo.width < 600){
    window.__isMobile = true
  }else{
    window.__isMobile = false
  }
})
export const getIsMobileBrowser = () => {
  if(window.__isMobile){
    return true
  }
  if(Platform.is.desktop){
    return false
  }
  if(Platform.is.mobile){
    return true
  }
  return false
};

export const watchIsMobileBrowser = (that, arg) => {
  window.addEventListener("resize", function(){
    const windowHWInfo = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
    let isMobile = (that as any)[arg]
    if(windowHWInfo.width < 600){
      isMobile = true
    }else{
      isMobile = false
    }
    if(isMobile !== (that as any)[arg]){
      (that as any)[arg] = isMobile
    }
  })
};

export default {
  getIsMobileBrowser,
  watchIsMobileBrowser
};
