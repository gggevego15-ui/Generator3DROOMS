(() => {
  const $ = id => document.getElementById(id);
  let api = null, loadPromise = null;
  function publish(module) { api = module.api; return true; }
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
    addObject:name=>api?.addObject(name), addAsset:asset=>api?.addAsset(asset), generate:()=>api?.generate(), syncRoom:()=>api?.syncRoom(),
    setMode:mode=>api?.setMode(mode), deleteSelected:()=>api?.deleteSelected(),
    rotateSelected:degrees=>api?.rotateSelected(degrees), setSelectedPosition:()=>api?.setPosition(),
    setScale:value=>api?.setScale(value), setQuality:value=>api?.setQuality(value), export4K:()=>api?.export4K()
  };
  document.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>{
    document.querySelectorAll("[data-mode]").forEach(el=>el.classList.toggle("active",el===button));
    api?.setMode(button.dataset.mode);
  }));
  ["roomWidth","roomDepth","roomHeight","roomStyle","roomType","density"].forEach(id=>$(id).addEventListener("change",()=>api?.syncRoom()));
  $("lightIntensity").addEventListener("input",()=>api?.syncRoom());
  $("shadowToggle").addEventListener("click",()=>{$("shadowToggle").classList.toggle("on");$("shadowToggle").setAttribute("aria-pressed",$("shadowToggle").classList.contains("on")?"true":"false");api?.syncRoom();});
  ["posX","posZ"].forEach(id=>$(id).addEventListener("change",()=>api?.setPosition()));
  $("objectScale").addEventListener("input",e=>api?.setScale(e.target.value));
  $("renderQuality").addEventListener("change",e=>api?.setQuality(e.target.value));
  $("export4kBtn").addEventListener("click",()=>{if(api?.isReady)api.export4K();else load().then(ok=>{if(ok)api?.export4K();});});
  $("generateBtn").addEventListener("click",()=>{if(api?.isReady)api.generate();else load().then(ok=>{if(ok)api?.generate();});});
  $("addSelectedBtn").addEventListener("click",()=>{const name=$("selectedName").textContent;if(api?.isReady&&name&&name!=="No object selected")api.addObject(name);});
  $("deleteSelectedBtn").addEventListener("click",()=>api?.deleteSelected());
  $("deleteObjectBtn").addEventListener("click",()=>api?.deleteSelected());
  $("rotateStepBtn").addEventListener("click",()=>api?.rotateSelected(15));
  $("gridBtn").addEventListener("click",()=>{$("gridBtn").classList.toggle("active");api?.toggleGrid();});
  $("zoomIn").addEventListener("click",()=>api?.zoomBy(.88));
  $("zoomOut").addEventListener("click",()=>api?.zoomBy(1.14));
  $("resetView").addEventListener("click",()=>api?.resetCamera());
  window.addEventListener("load",()=>load());
})();