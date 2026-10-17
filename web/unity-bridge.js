(() => {
  const $ = (id) => document.getElementById(id);
  const frame = $("sceneFrame");
  const canvas = $("unity-canvas");
  const notice = $("unityNotice");
  let unityInstance = null;
  let loadAttempted = false;
  let loadPromise = null;

  function setNotice(title, detail, loading = false) {
    const strong = notice.querySelector("strong");
    const small = notice.querySelector("small");
    if (strong) strong.textContent = title;
    if (small) small.textContent = detail;
    frame.classList.toggle("unity-loading", loading);
  }
  function unitySend(method, value) {
    if (!unityInstance || !window.unityBridgeReady) return false;
    try {
      unityInstance.SendMessage("Generator3DROOMS", method, String(value ?? ""));
      return true;
    } catch (error) {
      console.warn("[Generator3DROOMS] Unity bridge call failed:", method, error);
      return false;
    }
  }
  function roomPayload() {
    return JSON.stringify({
      width: Number($("roomWidth").value) || 5,
      depth: Number($("roomDepth").value) || 4,
      height: Number($("roomHeight").value) || 2.8,
      style: $("roomStyle").value,
      type: $("roomType").value,
      density: $("density").value,
      light: Number($("lightIntensity").value) || 65,
      shadows: $("shadowToggle").classList.contains("on")
    });
  }
  async function loadUnity() {
    if (unityInstance) return true;
    if (loadPromise) return loadPromise;
    loadAttempted = true;
    loadPromise = (async () => {
      const loaderUrl = "./Build/Build.loader.js";
      try {
        const check = await fetch(loaderUrl, { method: "HEAD", cache: "no-store" });
        if (!check.ok) throw new Error("Unity loader was not found at web/Build/Build.loader.js");
        setNotice("Loading Unity 3D scene…", "First load can take a little while.", true);
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = loaderUrl;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Could not load the Unity WebGL loader"));
          document.head.appendChild(script);
        });
        if (typeof createUnityInstance !== "function") throw new Error("Unity loader loaded but createUnityInstance is unavailable");
        const buildUrl = "./Build";
        const config = {
          dataUrl: buildUrl + "/Build.data",
          frameworkUrl: buildUrl + "/Build.framework.js",
          codeUrl: buildUrl + "/Build.wasm",
          streamingAssetsUrl: "StreamingAssets",
          companyName: "Generator3DROOMS",
          productName: "Generator3DROOMS",
          productVersion: "0.2",
          matchWebGLToCanvasSize: true,
          devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5)
        };
        unityInstance = await createUnityInstance(canvas, config, progress => {
          setNotice("Loading Unity 3D scene…", "Downloading 3D runtime " + Math.round(progress * 100) + "%", true);
        });
        frame.classList.add("unity-ready");
        window.unityBridgeReady = true;
        setNotice("Unity 3D scene connected", "Interactive 3D runtime is active.");
        unitySend("SetRoomDimensions", roomPayload());
        window.dispatchEvent(new CustomEvent("generator3drooms:unity-ready"));
        return true;
      } catch (error) {
        console.warn("[Generator3DROOMS] Unity WebGL not available:", error);
        setNotice("Unity WebGL build not found", "Build Unity to web/Build to enable the real 3D scene.");
        loadPromise = null;
        return false;
      }
    })();
    return loadPromise;
  }
  window.Generator3DROOMSUnity = {
    load: loadUnity,
    send: unitySend,
    syncRoom: () => unitySend("SetRoomDimensions", roomPayload()),
    generate: () => unitySend("GenerateRoom", roomPayload()),
    addObject: name => unitySend("AddCatalogObject", name),
    get isReady() { return !!unityInstance; }
  };

  ["roomWidth", "roomDepth", "roomHeight", "roomStyle", "roomType", "density", "lightIntensity", "shadowToggle"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("change", () => {
      if (unityInstance) unitySend("SetRoomDimensions", roomPayload());
    });
  });
  $("generateBtn")?.addEventListener("click", () => {
    if (unityInstance) unitySend("GenerateRoom", roomPayload());
    else if (!loadAttempted) loadUnity();
  });
  $("addSelectedBtn")?.addEventListener("click", () => {
    const name = $("selectedName")?.textContent;
    if (name && unityInstance) unitySend("AddCatalogObject", name);
    else if (!loadAttempted) loadUnity();
  });
  // Probe automatically; the CSS room preview remains available if no Unity build exists.
  window.addEventListener("load", () => { loadUnity(); });
})();
