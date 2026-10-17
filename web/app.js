(() => {
  const $ = (id) => document.getElementById(id);
  const catalogTemplates = [
    {category:"Furniture", count:320, entries:[
      ["Modular sofa","sofa"],["Loveseat","sofa"],["Armchair","chair"],["Dining chair","chair"],
      ["Bar stool","chair"],["Coffee table","table"],["Dining table","table"],["Side table","table"],
      ["TV console","cabinet"],["Bookshelf","cabinet"],["Wardrobe","cabinet"],["Bed frame","bed"],
      ["Nightstand","cabinet"],["Writing desk","table"],["Dresser","cabinet"],["Bathroom vanity","sink"]
    ]},
    {category:"Lighting", count:120, entries:[
      ["Floor lamp","lamp"],["Pendant lamp","lamp"],["Chandelier","lamp"],
      ["Table lamp","lamp"],["Wall sconce","lamp"],["Track light","lamp"]
    ]},
    {category:"Decor", count:240, entries:[
      ["Ceramic vase","vase"],["Decorative bowl","decor"],["Wall art","decor"],["Floor mirror","mirror"],
      ["Table sculpture","decor"],["Candle holder","decor"],["Throw pillow","decor"],["Blanket","decor"],
      ["Area rug","rug"],["Wall clock","decor"],["Book stack","decor"],["Picture frame","decor"]
    ]},
    {category:"Plants", count:80, entries:[
      ["Indoor plant","plant"],["Tall palm","plant"],["Olive tree","plant"],["Succulent planter","plant"]
    ]},
    {category:"Architecture", count:140, entries:[
      ["Window","window"],["Interior door","door"],["Sliding door","door"],["Room divider","partition"],
      ["Archway","arch"],["Wall panel","panel"],["Skylight","window"]
    ]},
    {category:"Appliances", count:100, entries:[
      ["Bathtub","bath"],["Shower enclosure","shower"],["Toilet","toilet"],
      ["Washing machine","appliance"],["Refrigerator","appliance"]
    ]}
  ];
  const finishes = ["Natural oak","Warm walnut","Matte white","Graphite","Soft sage"];
  const sizes = ["Compact","Standard","Wide","Premium"];
  const categories = catalogTemplates.flatMap(group => {
    const perTemplate = group.count / group.entries.length;
    const items = [];
    group.entries.forEach(([base, kind], baseIndex) => {
      for (let i = 0; i < perTemplate; i++) {
        const finish = finishes[i % finishes.length];
        const size = sizes[Math.floor(i / finishes.length) % sizes.length];
        const series = String(Math.floor(i / (finishes.length * sizes.length)) + 1).padStart(2, "0");
        items.push({name:`${base} — ${finish} · ${size} · ${series}`, category:group.category, price:"Free", kind, baseName:base, id:`${group.category}-${baseIndex}-${i}`});
      }
    });
    return items;
  });
  const PAGE_SIZE = 48;
  let visibleCount = PAGE_SIZE;
  let activeCategory = "All";
  let freeModels = [];
  let freeModelsStatus = "loading";
  let freeModelsTotal = 0;
  let catalogRoomFilter = "All rooms";
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
    cabinet: '<rect x="19" y="28" width="62" height="49" rx="3" fill="#a88966"/><rect x="23" y="32" width="26" height="41" fill="#c1a17b"/><rect x="51" y="32" width="26" height="41" fill="#b3916d"/><circle cx="44" cy="52" r="2" fill="#594a37"/><circle cx="56" cy="52" r="2" fill="#594a37"/><path d="M25 77v6M75 77v6" stroke="#514333" stroke-width="4"/>',

    bed: '<rect x="16" y="22" width="68" height="56" rx="4" fill="#987958"/><rect x="22" y="31" width="56" height="41" rx="4" fill="#d2c8b6"/><rect x="24" y="25" width="24" height="14" rx="3" fill="#e9e2d4"/>',
    bath: '<rect x="12" y="32" width="76" height="40" rx="13" fill="#d5d8d0"/><rect x="20" y="38" width="60" height="25" rx="10" fill="#aabbb5"/>',
    shower: '<path d="M20 14v70M80 14v70M20 14h60" stroke="#aeb8ae" stroke-width="4"/><rect x="24" y="20" width="52" height="60" fill="#9fbab6" fill-opacity=".55"/>',
    toilet: '<rect x="37" y="16" width="28" height="27" rx="3" fill="#d8d9d0"/><path d="M28 43h44q-2 30-22 30T28 43z" fill="#e7e7df"/>',
    sink: '<rect x="17" y="49" width="66" height="29" fill="#a78360"/><path d="M18 37q32-15 64 0l-5 15H23z" fill="#dedfd7"/>',
    appliance: '<rect x="23" y="12" width="54" height="72" rx="4" fill="#b9bcb4"/><rect x="30" y="20" width="40" height="39" rx="3" fill="#687772"/><circle cx="50" cy="39" r="12" fill="#9fb6b2"/>',
    mirror: '<rect x="25" y="12" width="50" height="76" rx="7" fill="#b89b78"/><rect x="31" y="18" width="38" height="64" rx="4" fill="#a9c3bf"/>',
    rug: '<rect x="12" y="22" width="76" height="56" rx="4" fill="#9a8e78"/><rect x="18" y="28" width="64" height="44" fill="none" stroke="#d4c7ad" stroke-width="3"/>',
    door: '<rect x="25" y="10" width="50" height="80" rx="2" fill="#9d7c59"/><rect x="31" y="16" width="38" height="68" fill="#b7956f"/>',
    partition: '<rect x="13" y="18" width="74" height="64" fill="#a58a6a"/><path d="M38 18v64M62 18v64" stroke="#d7c5a7" stroke-width="4"/>',
    panel: '<rect x="18" y="12" width="64" height="76" fill="#9a7958"/><path d="M26 20v60M40 20v60M54 20v60M68 20v60" stroke="#c4a27d" stroke-width="5"/>',
    decor: '<circle cx="50" cy="50" r="28" fill="#bca98d"/><circle cx="50" cy="50" r="18" fill="none" stroke="#e1d5c1" stroke-width="4"/>'
  };
  function showToast(message) {
    const toast = $("toast"); toast.textContent = message; toast.classList.add("visible");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("visible"), 2300);
  }
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  function renderCatalog() {
    const query = $("searchInput").value.trim().toLowerCase();
    const source = activeCategory === "Free 3D" ? freeModels : categories;
    const roomTerms = {
      "Living room": /sofa|couch|armchair|chair|coffee table|side table|tv|television|lamp|rug|vase|plant|shelf|book|mirror|sculpture|artwork|decor|cabinet|sideboard|ottoman|curtain|pillow|cushion|clock|stool|bench/i,
      "Bedroom": /bed|mattress|nightstand|bedside|wardrobe|dresser|closet|lamp|rug|mirror|pillow|cushion|blanket|curtain|bench|chest|cabinet/i,
      "Home office": /desk|office chair|chair|bookcase|shelf|monitor|computer|laptop|keyboard|lamp|cabinet|drawer|filing|clock|plant/i,
      "Kitchen": /kitchen|dining|stool|chair|table|cabinet|cupboard|shelf|fridge|refrigerator|oven|microwave|sink|tap|faucet|toaster|kettle|pot|pan|bowl|plate|mug|bottle|container|counter/i,
      "Dining room": /dining|table|chair|sideboard|cabinet|buffet|vase|lamp|pendant|chandelier|rug|artwork|mirror|bench/i,
      "Bathroom": /bath|shower|toilet|sink|faucet|tap|vanity|towel|mirror|cabinet|shelf|soap|basket|laundry/i,
      "Kids room": /kid|child|toy|teddy|crib|bunk|bed|chair|desk|shelf|storage|book|lamp|rug|basket/i,
      "Entryway": /entry|hall|coat|shoe|bench|console|mirror|umbrella|hanger|wardrobe|cabinet|basket|lamp/i,
      "Laundry room": /laundry|washing machine|washer|dryer|basket|shelf|cabinet|iron|ironing|detergent|sink/i
    };
    const filtered = source.filter(item => {
      const text = (item.name + " " + (item.tags || []).join(" ") + " " + (item.categories || []).join(" ") + " " + (item.description || "")).toLowerCase();
      const categoryMatch = activeCategory === "All" || activeCategory === "Free 3D" || item.category === activeCategory;
      const queryMatch = text.includes(query);
      const roomMatch = catalogRoomFilter === "All rooms" || (roomTerms[catalogRoomFilter]?.test(text) ?? true);
      return categoryMatch && queryMatch && roomMatch;
    });
    const visible = filtered.slice(0, visibleCount);
    $("objectGrid").innerHTML = visible.map(item => {
      const thumb = item.isExternal && item.thumb
        ? `<img src="${escapeHtml(item.thumb)}" alt="" loading="lazy" decoding="async">`
        : `<svg viewBox="0 0 100 100" aria-hidden="true">${(shapes[item.kind] || shapes.cabinet)}</svg>`;
      const meta = item.isExternal ? "CC0 · 4K glTF" : item.category;
      return `<button class="object-card ${selected?.name === item.name ? "selected" : ""}" data-object="${escapeHtml(item.id || item.name)}">
        <span class="object-thumb">${thumb}</span>
        <span class="object-name">${escapeHtml(item.name)}</span>
        <span class="object-meta"><span>${escapeHtml(meta)}</span><span class="free">${item.isExternal ? "Free" : item.price}</span></span>
      </button>`;
    }).join("");
    if (activeCategory === "Free 3D" && freeModelsStatus === "loading") $("resultCount").textContent = "Finding free CC0 models with verified 4K texture resolution…";
    else if (activeCategory === "Free 3D" && freeModelsStatus === "error") $("resultCount").textContent = "Model library unavailable — check your internet connection";
    else if (activeCategory === "Free 3D") $("resultCount").textContent = `${filtered.length} verified 4K CC0 models shown · ${freeModels.length} in this catalog (${freeModelsTotal} source models checked)`;
    else if (activeCategory === "All" && catalogRoomFilter !== "All rooms") $("resultCount").textContent = `${filtered.length.toLocaleString()} procedural objects matching ${catalogRoomFilter.toLowerCase()} · showing ${visible.length.toLocaleString()}`;
    else $("resultCount").textContent = `${filtered.length.toLocaleString()} procedural objects · showing ${visible.length.toLocaleString()}`;
    const moreButton = $("loadMoreObjects");
    moreButton.hidden = visible.length >= filtered.length;
    moreButton.textContent = `Load more (${Math.min(PAGE_SIZE, filtered.length - visible.length)} of ${filtered.length - visible.length} remaining)`;
    $("objectGrid").querySelectorAll("[data-object]").forEach(button => button.addEventListener("click", () => {
      selected = source.find(item => String(item.id || item.name) === button.dataset.object);
      if (!selected) return;
      $("selectedName").textContent = selected.name;
      $("addSelectedBtn").disabled = false;
      $("posX").disabled = false; $("posZ").disabled = false;
      if (selected.isExternal) showToast("CC0 model selected · it will load when added to the 3D room");
      renderCatalog();
    }));
  }
  async function loadFreeModels() {
    try {
      const response = await fetch("https://api.polyhaven.com/assets?type=models", {headers:{"Accept":"application/json"}});
      if (!response.ok) throw new Error("Poly Haven API returned HTTP " + response.status);
      const payload = await response.json();
      const entries = Object.entries(payload || {});
      freeModelsTotal = entries.length;
      const furniturePattern = /furniture|sofa|couch|chair|table|bed|cabinet|shelf|desk|lamp|lighting|rug|plant|stool|wardrobe|ottoman|nightstand|dresser|decor|interior|vase|pottery|ceramic|bowl|sculpture|statue|artwork|painting|picture|frame|mirror|clock|book|basket|candle|pillow|cushion|blanket|curtain|textile|planter|flower|flowerpot|sideboard|bench|console|sconce|chandelier|pendant|kitchen|bathroom|bath|sink|tap|faucet|toilet|shower|towel|appliance|dining|storage|ornament|figurine|container|armchair|bookshelf/i;
      freeModels = entries.filter(([id,item]) => {
        const resolution = Array.isArray(item?.max_resolution) ? item.max_resolution : [];
        const is4K = resolution.length >= 2 && resolution.every(value => Number(value) >= 4096);
        const text = [id,item?.name,item?.description,item?.category,...(item?.categories||[]),...(item?.tags||[])].join(" ");
        return item && is4K && furniturePattern.test(text);
      }).map(([id,item]) => {
        const label = String(item.name || id).slice(0,120);
        const rawCategory = [item.category,...(item.categories||[]),...(item.tags||[])].filter(Boolean).join(" ").toLowerCase();
        const searchText = rawCategory + " " + label.toLowerCase();
        let kind = "cabinet";
        if (/sofa|couch|chair|seating|stool|bench/.test(searchText)) kind = "sofa";
        else if (/table|desk/.test(searchText)) kind = "table";
        else if (/lamp|light|chandelier|sconce/.test(searchText)) kind = "lamp";
        else if (/plant|tree|flower/.test(searchText)) kind = "plant";
        else if (/bed|mattress/.test(searchText)) kind = "bed";
        else if (/rug|carpet|curtain|blanket|pillow|cushion|textile/.test(searchText)) kind = "rug";
        else if (/vase|pottery|ceramic|bowl|sculpture|statue|artwork|painting|picture|frame|mirror|clock|book|basket|candle|decor|flowerpot|planter|figurine/.test(searchText)) kind = "decor";
        return {
          id:"polyhaven-"+id,name:label,category:"Free 3D",price:"Free",kind,isExternal:true,
          modelId:id,modelUrl:"",thumb:typeof item.thumbnail_url==="string"&&/^https:\/\//i.test(item.thumbnail_url)?item.thumbnail_url:"",
          license:"CC0",source:"Poly Haven",maxResolution:Math.max(...(item.max_resolution||[]).map(Number)),
          tags:[...(item.categories||[]),...(item.tags||[]),item.category||""],description:item.description||""
        };
      });
      freeModelsStatus = "ready";
      const count = $("freeModelCount"); if (count) count.textContent = String(freeModels.length);
    } catch (error) {
      console.warn("[Generator3DROOMS] Poly Haven 4K model library unavailable", error);
      freeModelsStatus = "error";
      const count = $("freeModelCount"); if (count) count.textContent = "Retry";
    }
    if (activeCategory === "Free 3D") renderCatalog();
  }
  $("searchInput").addEventListener("input", () => { visibleCount = PAGE_SIZE; renderCatalog(); });
  $("catalogRoomFilter").addEventListener("change", () => { catalogRoomFilter = $("catalogRoomFilter").value; visibleCount = PAGE_SIZE; renderCatalog(); });
  $("roomType").addEventListener("change", () => { const select = $("catalogRoomFilter"); if (select && [...select.options].some(option => option.value === $("roomType").value)) { select.value = $("roomType").value; catalogRoomFilter = select.value; renderCatalog(); } });
  $("loadMoreObjects").addEventListener("click", () => { visibleCount += PAGE_SIZE; renderCatalog(); });
  document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    visibleCount = PAGE_SIZE;
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
      if (selected.isExternal) window.Generator3DROOMSUnity.addAsset(selected);
      else window.Generator3DROOMSUnity.addObject(selected.name);
      showToast(`${selected.name} added to the 3D scene`);
    } else {
      window.Generator3DROOMSUnity?.load();
      showToast("Starting the real-time WebGL scene — try adding the object again in a moment");
    }
    $("generateStatus").textContent = `${selected.name} selected. Add it to the real-time 3D scene.`;
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
    $("generateStatus").textContent=`Draft layout prepared: ${type.toLowerCase()}, ${density} furnishing. The real-time WebGL scene updates the layout.`;
    $("previewSofa").style.left=(18+Math.floor(Math.random()*10))+"%";
    $("previewSofa").style.top=(42+Math.floor(Math.random()*8))+"%";
    saveHistory(); showToast("Layout concept generated");
  });
  renderCatalog();
  loadFreeModels();
  saveHistory();
})();
