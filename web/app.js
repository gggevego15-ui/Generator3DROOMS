(() => {
  const $ = (id) => document.getElementById(id);
  const categories = [
    {name:"Lounge chair",category:"Furniture",price:"Free",kind:"chair"},
    {name:"Modular sofa",category:"Furniture",price:"Free",kind:"sofa"},
    {name:"Coffee table",category:"Furniture",price:"Free",kind:"table"},
    {name:"Pendant lamp",category:"Lighting",price:"Free",kind:"lamp"},
    {name:"Indoor plant",category:"Plants",price:"Free",kind:"plant"},
    {name:"Ceramic vase",category:"Decor",price:"Free",kind:"vase"},
    {name:"Floor window",category:"Architecture",price:"Free",kind:"window"},
    {name:"Side cabinet",category:"Furniture",price:"Free",kind:"cabinet"}
  ];
  let activeCategory = "All";
  let selected = null;
  let zoom = 100;
  let shadows = true;
  let gridVisible = true;
  let history = [];
  let future = [];
  let toastTimer;

  const shapes = {
    chair: '<rect x="31" y="39" width="39" height="30" rx="7" fill="#89937a"/><rect x="34" y="17" width="33" height="28" rx="7" fill="#aab39a"/><path d="M37 66v17M64 66v17" stroke="#544b3d" stroke-width="4"/>',
    sofa: '<rect x="12" y="38" width="76" height="31" rx="8" fill="#78846c"/><rect x="18" y="19" width="64" height="28" rx="7" fill="#9da890"/><path d="M18 48v17M82 48v17" stroke="#b6bea8" stroke-width="5"/><path d="M24 68v10M76 68v10" stroke="#514839" stroke-width="4"/>',
    table: '<ellipse cx="50" cy="40" rx="37" ry="16" fill="#b8956d"/><path d="M24 41v32M76 41v32" stroke="#70543a" stroke-width="5"/><ellipse cx="50" cy="37" rx="37" ry="16" fill="#d0b18a"/>',
    lamp: '<path d="M50 15v42" stroke="#b8b9a5" stroke-width="3"/><path d="M27 38 38 16h24l11 22z" fill="#d7d0b6"/><ellipse cx="50" cy="39" rx="24" ry="5" fill="#a9a58f"/><path d="M38 59h24l7 8H31z" fill="#74796b"/>',
    plant: '<path d="M50 66V25M50 49 28 30M50 43 70 23M50 36 42 14" stroke="#7f9b63" stroke-width="4" stroke-linecap="round"/><ellipse cx="27" cy="28" rx="13" ry="7" transform="rotate(30 27 28)" fill="#6c8755"/><ellipse cx="70" cy="22" rx="14" ry="8" transform="rotate(-35 70 22)" fill="#4d6c40"/><ellipse cx="42" cy="15" rx="12" ry="7" fill="#91a872"/><path d="M33 61h34l-5 23H38z" fill="#b49a7a"/>',
    vase: '<path d="M42 18h16l-2 13q-1 6 8 17l-1 23q-13 8-26 0l-1-23q9-11 8-17z" fill="#c7bda6"/><ellipse cx="50" cy="18" rx="8" ry="3" fill="#8e8876"/>',
    window: '<rect x="19" y="12" width="62" height="68" rx="2" fill="#9b896b"/><rect x="25" y="18" width="50" height="56" fill="#a8c5c0"/><path d="M50 18v56M25 46h50" stroke="#d4c8ad" stroke-width="4"/>',
    cabinet: '<rect x="19" y="28" width="62" height="49" rx="3" fill="#a88966"/><rect x="23" y="32" width="26" height="41" fill="#c1a17b"/><rect x="51" y="32" width="26" height="41" fill="#b3916d"/><circle cx="44" cy="52" r="2" fill="#594a37"/><circle cx="56" cy="52" r="2" fill="#594a37"/><path d="M25 77v6M75 77v6" stroke="#514333" stroke-width="4"/>'
  };
  function showToast(message) {
    const toast = $("toast"); toast.textContent = message; toast.classList.add("visible");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("visible"), 2300);
  }
  function renderCatalog() {
    const query = $("searchInput").value.trim().toLowerCase();
    const filtered = categories.filter(item => (activeCategory === "All" || item.category === activeCategory) && item.name.toLowerCase().includes(query));
    $("objectGrid").innerHTML = filtered.map(item => `
      <button class="object-card ${selected?.name === item.name ? "selected" : ""}" data-object="${item.name}">
        <span class="object-thumb"><svg viewBox="0 0 100 100" aria-hidden="true">${shapes[item.kind]}</svg></span>
        <span class="object-name">${item.name}</span>
        <span class="object-meta"><span>${item.category}</span><span class="free">${item.price}</span></span>
      </button>`).join("");
    $("resultCount").textContent = `${filtered.length} procedural preview${filtered.length === 1 ? "" : "s"}`;
    $("objectGrid").querySelectorAll("[data-object]").forEach(button => button.addEventListener("click", () => {
      selected = categories.find(item => item.name === button.dataset.object);
      $("selectedName").textContent = selected.name;
      $("addSelectedBtn").disabled = false;
      $("posX").disabled = false; $("posZ").disabled = false;
      renderCatalog();
    }));
  }
  $("searchInput").addEventListener("input", renderCatalog);
  document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    document.querySelectorAll("[data-category]").forEach(el => el.classList.toggle("selected", el === button));
    renderCatalog();
  }));
  document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(el => el.classList.toggle("active", el === button));
    const tab = button.dataset.tab;
    $("catalogPanel").classList.toggle("hidden", tab !== "catalog");
    $("layersPanel").classList.toggle("hidden", tab !== "layers");
    $("roomPanel").classList.toggle("hidden", tab !== "room");
  }));
  function updateDimensions() {
    const w = Math.max(2, Math.min(20, Number($("roomWidth").value) || 5));
    const d = Math.max(2, Math.min(20, Number($("roomDepth").value) || 4));
    const h = Math.max(2, Math.min(6, Number($("roomHeight").value) || 2.8));
    $("roomWidth").value = w; $("roomDepth").value = d; $("roomHeight").value = h;
    document.querySelector(".scene-dimensions").textContent = `${w.toFixed(1)} m × ${d.toFixed(1)} m × ${h.toFixed(1)} m`;
    saveHistory();
  }
  ["roomWidth","roomDepth","roomHeight"].forEach(id => $(id).addEventListener("change", updateDimensions));
  $("lightIntensity").addEventListener("input", () => {
    const value = Number($("lightIntensity").value);
    $("lightValue").textContent = value + "%";
    $("roomPreview").style.filter = `brightness(${0.65 + value / 180})`;
  });
  $("shadowToggle").addEventListener("click", () => {
    shadows = !shadows; $("shadowToggle").classList.toggle("on", shadows);
    $("shadowToggle").setAttribute("aria-pressed", String(shadows));
    $("roomPreview").style.filter = shadows ? "" : "drop-shadow(0 0 0 transparent)";
  });
  $("gridBtn").addEventListener("click", () => {
    gridVisible = !gridVisible;
    $("gridBtn").classList.toggle("active", gridVisible);
    document.querySelector(".room-floor").style.opacity = gridVisible ? "1" : ".65";
    showToast(gridVisible ? "Floor guides enabled" : "Floor guides softened");
  });
  function setZoom(next) {
    zoom = Math.max(60, Math.min(140, next));
    $("zoomLabel").textContent = zoom + "%";
    $("roomPreview").style.transform = `translate(-50%,-50%) scale(${zoom / 100})`;
  }
  $("zoomIn").addEventListener("click", () => setZoom(zoom + 10));
  $("zoomOut").addEventListener("click", () => setZoom(zoom - 10));
  $("resetView").addEventListener("click", () => setZoom(100));
  $("addSelectedBtn").addEventListener("click", () => {
    if (!selected) return;
    if (window.Generator3DROOMSUnity?.isReady) {
      window.Generator3DROOMSUnity.addObject(selected.name);
      showToast(`${selected.name} added to the 3D scene`);
    } else {
      window.Generator3DROOMSUnity?.load();
      showToast("Unity WebGL build is required to place objects in 3D");
    }
    $("generateStatus").textContent = `${selected.name} selected. Add it to the scene when Unity WebGL is connected.`;
  });
  function saveHistory() {
    history.push({w:$("roomWidth").value,d:$("roomDepth").value,h:$("roomHeight").value,style:$("roomStyle").value});
    if (history.length > 30) history.shift(); future = [];
  }
  $("undoBtn").addEventListener("click", () => {
    if (history.length < 2) return showToast("Nothing to undo yet");
    future.push(history.pop()); const s = history[history.length - 1];
    $("roomWidth").value=s.w; $("roomDepth").value=s.d; $("roomHeight").value=s.h; $("roomStyle").value=s.style;
    updateDimensions(); showToast("Room settings restored");
  });
  $("redoBtn").addEventListener("click", () => {
    if (!future.length) return showToast("Nothing to redo");
    const s=future.pop(); $("roomWidth").value=s.w; $("roomDepth").value=s.d; $("roomHeight").value=s.h; $("roomStyle").value=s.style;
    updateDimensions(); showToast("Room settings restored");
  });
  $("saveBtn").addEventListener("click", () => {
    const data = {app:"Generator3DROOMS",version:"0.1",room:{width:Number($("roomWidth").value),depth:Number($("roomDepth").value),height:Number($("roomHeight").value),style:$("roomStyle").value,type:$("roomType").value,density:$("density").value,light:Number($("lightIntensity").value),shadows},selectedObject:selected};
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="generator3drooms-project.json"; a.click(); URL.revokeObjectURL(url);
    showToast("Project settings exported");
  });
  $("generateBtn").addEventListener("click", () => {
    const type=$("roomType").value, density=$("density").value;
    const styles=["Warm minimal","Scandinavian","Modern luxury","Industrial","Japandi"];
    $("roomStyle").value=styles[Math.floor(Math.random()*styles.length)];
    $("generateStatus").textContent=`Draft layout prepared: ${type.toLowerCase()}, ${density} furnishing. Actual 3D placement requires a Unity WebGL build.`;
    $("previewSofa").style.left=(18+Math.floor(Math.random()*10))+"%";
    $("previewSofa").style.top=(42+Math.floor(Math.random()*8))+"%";
    saveHistory(); showToast("Layout concept generated");
  });
  renderCatalog();
  saveHistory();
})();
