(() => {
  const $ = id => document.getElementById(id);
  let api = null, loadPromise = null;
  function publish(module) {
    api = module.api;
    return true;
  }
  function load() {
    if (api) return Promise.resolve(true);
    if (loadPromise) return loadPromise;
    loadPromise = import("./three-scene.js").then(publish).catch(error => {
      console.error("[Generator3DROOMS] Could not load Three.js scene",error);
      const notice=$("unityNotice");
      if(notice){notice.style.display="flex";notice.querySelector("strong").textContent="3D scene could not start";notice.querySelector("small").textContent="Check WebGL support and internet access for the Three.js library.";}
      loadPromise=null; return false;
    });
    return loadPromise;
  }
  window.Generator3DROOMSUnity = {
    load, get isReady(){return !!api?.isReady;},
    addObject:name=>api?.addObject(name), generate:()=>api?.generate(), syncRoom:()=>api?.syncRoom(),
    setMode:mode=>api?.setMode(mode), deleteSelected:()=>api?.deleteSelected(),
    rotateSelected:degrees=>api?.rotateSelected(degrees), setSelectedPosition:()=>api?.setPosition()
  };
  document.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>{
    document.querySelectorAll("[data-mode]").forEach(el=>el.classList.toggle("active",el===button));
    api?.setMode(button.dataset.mode);
  }));
  ["roomWidth","roomDepth","roomHeight","roomStyle","roomType","density","lightIntensity","shadowToggle"].forEach(id=>$(id).addEventListener("change",()=>api?.syncRoom()));
  ["posX","posZ"].forEach(id=>$(id).addEventListener("change",()=>api?.setSelectedPosition()));
  $("generateBtn").addEventListener("click",()=>{if(api?.isReady)api.generate();else load().then(()=>api?.generate());});
  $("deleteSelectedBtn").addEventListener("click",()=>api?.deleteSelected());
  $("deleteObjectBtn").addEventListener("click",()=>api?.deleteSelected());
  $("rotateStepBtn").addEventListener("click",()=>api?.rotateSelected(15));
  $("gridBtn").addEventListener("click",()=>api?.toggleGrid());
  $("zoomIn").addEventListener("click",()=>api?.zoomBy(.88));
  $("zoomOut").addEventListener("click",()=>api?.zoomBy(1.14));
  $("resetView").addEventListener("click",()=>api?.resetCamera());
  window.addEventListener("load",()=>load());
})();