(() => {
  const $ = (id) => document.getElementById(id);
  const frame = $("sceneFrame"), canvas = $("unity-canvas"), notice = $("unityNotice");
  let unityInstance = null, loadAttempted = false, loadPromise = null;
  let activeMode = "select", selectedObjectName = "";
  function setNotice(title, detail, loading = false) {
    const strong = notice.querySelector("strong"), small = notice.querySelector("small");
    if (strong) strong.textContent = title;
    if (small) small.textContent = detail;
    frame.classList.toggle("unity-loading", loading);
  }
  function unitySend(method, value) {
    if (!unityInstance || !window.unityBridgeReady) return false;
    try { unityInstance.SendMessage("Generator3DROOMS", method, String(value ?? "")); return true; }
    catch (error) { console.warn("[Generator3DROOMS] Unity bridge call failed:", method, error); return false; }
  }
  function roomPayload() {
    return JSON.stringify({width:Number($("roomWidth").value)||5,depth:Number($("roomDepth").value)||4,height:Number($("roomHeight").value)||2.8,style:$("roomStyle").value,type:$("roomType").value,density:$("density").value,light:Number($("lightIntensity").value)||65,shadows:$("shadowToggle").classList.contains("on")});
  }
  function setSelection(name, x, z, yaw) {
    selectedObjectName = name || "";
    const selected = !!selectedObjectName;
    $("selectedName").textContent = selected ? selectedObjectName : "No object selected";
    ["posX","posZ","addSelectedBtn","rotateStepBtn","deleteSelectedBtn","deleteObjectBtn"].forEach(id => { $(id).disabled = !selected; });
    if (selected) {
      $("posX").value = Number(x||0).toFixed(2); $("posZ").value = Number(z||0).toFixed(2);
      $("generateStatus").textContent = selectedObjectName + " selected. Drag to move or rotate using the toolbar.";
    } else $("generateStatus").textContent = "Select a furniture item in the 3D scene to edit its position.";
  }
  function setTransform(x,z,yaw) {
    if (selectedObjectName) { $("posX").value=Number(x||0).toFixed(2); $("posZ").value=Number(z||0).toFixed(2); }
  }
  window.Generator3DROOMS_OnSelection = setSelection;
  window.Generator3DROOMS_OnTransform = setTransform;
  async function loadUnity() {
    if (unityInstance) return true;
    if (loadPromise) return loadPromise;
    loadAttempted = true;
    loadPromise = (async () => {
      try {
        const loaderUrl="./Build/Build.loader.js";
        const check=await fetch(loaderUrl,{method:"HEAD",cache:"no-store"});
        if(!check.ok) throw new Error("Unity WebGL loader missing");
        setNotice("Loading Unity 3D scene…","First load can take a little while.",true);
        await new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=loaderUrl;script.onload=resolve;script.onerror=()=>reject(new Error("Unity loader failed"));document.head.appendChild(script);});
        if(typeof createUnityInstance!=="function") throw new Error("createUnityInstance unavailable");
        const base="./Build";
        unityInstance=await createUnityInstance(canvas,{dataUrl:base+"/Build.data",frameworkUrl:base+"/Build.framework.js",codeUrl:base+"/Build.wasm",streamingAssetsUrl:"StreamingAssets",companyName:"Generator3DROOMS",productName:"Generator3DROOMS",productVersion:"0.3",matchWebGLToCanvasSize:true,devicePixelRatio:Math.min(window.devicePixelRatio||1,1.5)},progress=>setNotice("Loading Unity 3D scene…","Downloading 3D runtime "+Math.round(progress*100)+"%",true));
        frame.classList.add("unity-ready"); window.unityBridgeReady=true;
        setNotice("Unity 3D scene connected","Select, move and rotate furniture with the mouse.");
        unitySend("SetRoomDimensions",roomPayload()); unitySend("SetEditMode",activeMode);
        window.dispatchEvent(new CustomEvent("generator3drooms:unity-ready")); return true;
      } catch(error) {
        console.warn("[Generator3DROOMS] Unity WebGL not available:",error);
        setNotice("Unity WebGL build not found","Build Unity to web/Build to enable real 3D editing.");
        loadPromise=null; return false;
      }
    })();
    return loadPromise;
  }
  window.Generator3DROOMSUnity={
    load:loadUnity,send:unitySend,syncRoom:()=>unitySend("SetRoomDimensions",roomPayload()),
    generate:()=>unitySend("GenerateRoom",roomPayload()),addObject:name=>unitySend("AddCatalogObject",name),
    setMode:mode=>{activeMode=mode;return unitySend("SetEditMode",mode);},
    deleteSelected:()=>unitySend("DeleteSelectedObject",""),
    rotateSelected:degrees=>unitySend("RotateSelected",degrees),
    setSelectedPosition:()=>unitySend("SetSelectedPosition",$("posX").value+","+ $("posZ").value),
    get isReady(){return !!unityInstance;}
  };
  document.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>{
    activeMode=button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach(el=>el.classList.toggle("active",el===button));
    unitySend("SetEditMode",activeMode);
    if(activeMode==="move")setNotice("Move mode","Select an object and drag it across the floor.");
    else if(activeMode==="rotate")setNotice("Rotate mode","Select an object and drag horizontally to rotate.");
    else if(unityInstance)setNotice("Select mode","Click furniture in the scene to select it.");
  }));
  ["roomWidth","roomDepth","roomHeight","roomStyle","roomType","density","lightIntensity","shadowToggle"].forEach(id=>$(id).addEventListener("change",()=>{if(unityInstance)unitySend("SetRoomDimensions",roomPayload());}));
  ["posX","posZ"].forEach(id=>$(id).addEventListener("change",()=>{if(unityInstance)unitySend("SetSelectedPosition",$("posX").value+","+ $("posZ").value);}));
  $("generateBtn").addEventListener("click",()=>{if(unityInstance)unitySend("GenerateRoom",roomPayload());else loadUnity();});
  $("addSelectedBtn").addEventListener("click",()=>{if(selectedObjectName&&unityInstance)unitySend("AddCatalogObject",selectedObjectName);else loadUnity();});
  $("rotateStepBtn").addEventListener("click",()=>unitySend("RotateSelected",15));
  $("deleteSelectedBtn").addEventListener("click",()=>unitySend("DeleteSelectedObject",""));
  $("deleteObjectBtn").addEventListener("click",()=>unitySend("DeleteSelectedObject",""));
  window.addEventListener("load",()=>{loadUnity();});
})();