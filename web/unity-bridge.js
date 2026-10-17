(() => {
  const $ = id => document.getElementById(id);
  let api = null, loadPromise = null;
  function load() {
    if (api) return Promise.resolve(true);
    if (loadPromise) return loadPromise;
    loadPromise = import("./three-scene.js").then(module => {
      api = module.api;
      window.Generator3DROOMSUnity = {
        load, get isReady(){return !!api?.isReady;},
        addObject:name=>api?.addObject(name),
        generate:()=>api?.generate(),
        syncRoom:()=>api?.syncRoom(),
        setMode:mode=>api?.setMode(mode),
        deleteSelected:()=>api?.deleteSelected(),
        rotateSelected:degrees=>api?.rotateSelected(degrees),
        setSelectedPosition:()=>api?.setPosition()
      };
      return true;
    }).catch(error => {
      console.error("[Generator3DROOMS] Could not load WebGL scene",error);
      const notice=$("unityNotice");if(notice){notice.style.display="flex";notice.querySelector("strong").textContent="Could not start 3D";notice.querySelector("small").textContent="Check WebGL support and internet access for Three.js.";}
      return false;
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
  ["posX","posZ"].forEach(id=>$(id).addEventListener("change",()=>api?.setPosition()));
  $("generateBtn").addEventListener("click",()=>{if(api?.isReady)api.generate();else load().then(()=>api?.generate());});
  $("addSelectedBtn").addEventListener("click",()=>{if(api?.isReady){const name=$("selectedName").textContent;if(name&&name!=="No object selected")api.addObject(name);}});
  $("deleteSelectedBtn").addEventListener("click",()=>api?.deleteSelected());
  $("deleteObjectBtn").addEventListener("click",()=>api?.deleteSelected());
  $("rotateStepBtn").addEventListener("click",()=>api?.rotateSelected(15));
  $("gridBtn").addEventListener("click",()=>{if(api?.isReady){const btn=$("gridBtn");window.generator3droomsGridVisible=btn.classList.contains("active");const grid=window.generator3droomsGridVisible;document.querySelectorAll(".scene-frame").forEach(()=>{});}});
  $("zoomIn").addEventListener("click",()=>{if(api?.isReady)api.syncRoom();});
  $("zoomOut").addEventListener("click",()=>{if(api?.isReady)api.syncRoom();});
  $("resetView").addEventListener("click",()=>{if(api?.isReady)api.generate();});
  window.addEventListener("load",()=>load());
})();