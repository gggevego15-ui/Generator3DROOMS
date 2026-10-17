import * as THREE from "https://esm.sh/three@0.165.0";
import { OrbitControls } from "https://esm.sh/three@0.165.0/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "https://esm.sh/three@0.165.0/examples/jsm/environments/RoomEnvironment.js";

const $ = id => document.getElementById(id);
const sceneFrame = $("sceneFrame");
const canvas = $("unity-canvas");
const notice = $("unityNotice");
let renderer, scene, camera, controls, roomRoot, furnitureRoot, selectedRoot = null;
let raycaster, pointer, drag = null, mode = "select", floor, sun, ambient, gridHelper, gridVisible = true, lastType = "", lastDensity = "";
let quality = "balanced", selectionHelper = null, dragPlane, pmremGenerator, environmentTexture, renderInProgress = false, windowLight = null;
let width = 5, depth = 4, height = 2.8, lightPower = 65, shadowsEnabled = true;
const pickables = [];
const mats = {};
const selectionMat = new THREE.MeshStandardMaterial({color:0xd8f879,emissive:0x344b10,roughness:.55});
const originalMaterials = new WeakMap();

function canvasTexture(draw, repeatX=1, repeatY=1) {
  const c = document.createElement("canvas"); c.width=512; c.height=512;
  const ctx=c.getContext("2d"); draw(ctx,c.width,c.height);
  const tex=new THREE.CanvasTexture(c); tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(repeatX,repeatY); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function makeMaterials() {
  const wood=canvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#9c7955";ctx.fillRect(0,0,w,h);
    for(let i=0;i<95;i++){const y=Math.random()*h;ctx.strokeStyle=["#6e5038","#b9956c","#d0ad80","#886444"][i%4];ctx.globalAlpha=.12+Math.random()*.22;ctx.lineWidth=1+Math.random()*5;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(w*.3,y-12,w*.65,y+12,w,y+(Math.random()-.5)*12);ctx.stroke();}
    ctx.globalAlpha=1;
  },2,2);
  const plaster=canvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#d8d0bf";ctx.fillRect(0,0,w,h);
    for(let i=0;i<18000;i++){const v=Math.random()>.5?255:70;ctx.fillStyle="rgba("+v+","+v+","+v+","+(Math.random()*.06)+")";ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}
  },2,1);
  const rug=canvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#b6a68c";ctx.fillRect(0,0,w,h);
    for(let i=0;i<5000;i++){ctx.fillStyle=Math.random()>.5?"rgba(245,235,215,.12)":"rgba(62,53,40,.08)";ctx.fillRect(Math.random()*w,Math.random()*h,1,2);}
    ctx.strokeStyle="rgba(236,225,202,.6)";ctx.lineWidth=7;ctx.strokeRect(24,24,w-48,h-48);ctx.strokeRect(39,39,w-78,h-78);
  },1,1);
  mats.wall=new THREE.MeshStandardMaterial({map:plaster,bumpMap:plaster,bumpScale:.025,roughness:.94,envMapIntensity:.28});
  mats.floor=new THREE.MeshStandardMaterial({map:wood,bumpMap:wood,bumpScale:.035,roughness:.68,envMapIntensity:.42});
  mats.wood=new THREE.MeshStandardMaterial({map:wood,bumpMap:wood,bumpScale:.018,roughness:.43,envMapIntensity:.55});
  mats.fabric=new THREE.MeshStandardMaterial({color:0x858b78,roughness:.96});
  mats.cushion=new THREE.MeshStandardMaterial({color:0xc5b69d,roughness:.94});
  mats.darkWood=new THREE.MeshStandardMaterial({color:0x4d4032,roughness:.55});
  mats.metal=new THREE.MeshStandardMaterial({color:0x292c29,metalness:.72,roughness:.3});
  mats.glass=new THREE.MeshPhysicalMaterial({color:0xc5e5ed,roughness:.09,metalness:.02,transmission:.35,transparent:true,opacity:.52,ior:1.45,thickness:.12,side:THREE.DoubleSide,envMapIntensity:.9});
  mats.white=new THREE.MeshStandardMaterial({color:0xe9e5da,roughness:.28});
  mats.leaf=new THREE.MeshStandardMaterial({color:0x4f7043,roughness:.85});
  mats.rug=new THREE.MeshStandardMaterial({map:rug,roughness:1});
  mats.accent=new THREE.MeshStandardMaterial({color:0xb28c64,roughness:.5});
}
function box(parent,name,pos,size,material,opts={}) {
  const geometry=new THREE.BoxGeometry(size[0],size[1],size[2],opts.seg||1,opts.seg||1,opts.seg||1);
  const mesh=new THREE.Mesh(geometry,material); mesh.name=name;
  mesh.position.set(...pos); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
function roundedBox(parent,name,pos,size,material,r=.06) {
  const group=new THREE.Group();group.name=name;group.position.set(...pos);parent.add(group);
  const core=box(group,name+" body",[0,0,0],[size[0]-r,size[1]-r,size[2]-r],material);
  // Soft silhouette is added with small edge cylinders to avoid a visibly sharp CAD look.
  const edgeMat=material;
  for(const x of [-1,1]) for(const z of [-1,1]) {
    const edge=new THREE.Mesh(new THREE.CylinderGeometry(r*.6,r*.6,size[1],8),edgeMat);
    edge.position.set(x*(size[0]/2-r/2),0,z*(size[2]/2-r/2));edge.castShadow=true;group.add(edge);
  }
  core.position.y=0; return group;
}
function makePlant(parent, x, z, scale=1) {
  const group=new THREE.Group();group.name="Indoor plant";group.position.set(x,0,z);parent.add(group);
  const pot= new THREE.Mesh(new THREE.CylinderGeometry(.2*scale,.15*scale,.36*scale,32),mats.accent);pot.position.y=.18*scale;pot.castShadow=true;group.add(pot);
  const soil=new THREE.Mesh(new THREE.CylinderGeometry(.17*scale,.17*scale,.025*scale,24),mats.darkWood);soil.position.y=.36*scale;group.add(soil);
  for(let i=0;i<9;i++){
    const a=i*2.399, y=(.55+(i%4)*.17)*scale;
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(.12*scale,12,10),mats.leaf);
    leaf.scale.set(.65,1.8,.48);leaf.position.set(Math.cos(a)*(.12+(i%3)*.07)*scale,y,Math.sin(a)*(.12+(i%3)*.07)*scale);
    leaf.rotation.z=Math.cos(a)*.55;leaf.rotation.x=Math.sin(a)*.45;leaf.castShadow=true;group.add(leaf);
  }
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.018*scale,.028*scale,.85*scale,8),mats.darkWood);stem.position.y=.72*scale;group.add(stem);
  group.traverse(o=>{if(o.isMesh){o.userData.selectableRoot=group;pickables.push(o);}});return group;
}
function registerFurniture(group) {
  group.traverse(o=>{if(o.isMesh){o.userData.selectableRoot=group;pickables.push(o);}});
  group.userData.isFurniture=true; return group;
}
function makeSofa(x=0,z=.6,name="Modular sofa") {
  const g=new THREE.Group();g.name=name;g.position.set(x,0,z);furnitureRoot.add(g);
  box(g,"Sofa plinth",[0,.2,0],[2.05,.25,.78],mats.darkWood);
  roundedBox(g,"Sofa seat",[0,.42,-.02],[2.12,.27,.88],mats.fabric,.09);
  roundedBox(g,"Sofa back",[0,.79,.31],[2.12,.78,.24],mats.fabric,.09);
  roundedBox(g,"Left arm",[-.98,.55,-.02],[.23,.53,.88],mats.fabric,.07);
  roundedBox(g,"Right arm",[.98,.55,-.02],[.23,.53,.88],mats.fabric,.07);
  for(let i=0;i<3;i++) roundedBox(g,"Seat cushion "+(i+1),[-.61+i*.61,.59,-.1],[.57,.12,.61],i===1?mats.cushion:mats.fabric,.07);
  for(const x0 of [-.82,.82])for(const z0 of [-.27,.27])box(g,"Sofa foot",[x0,.08,z0],[.07,.16,.07],mats.darkWood);
  return registerFurniture(g);
}
function makeTable(x=0,z=-.55,name="Coffee table") {
  const g=new THREE.Group();g.name=name;g.position.set(x,0,z);furnitureRoot.add(g);
  box(g,"Tabletop",[0,.48,0],[1.25,.09,.72],mats.wood);
  for(const x0 of [-.48,.48])for(const z0 of [-.25,.25])box(g,"Table leg",[x0,.24,z0],[.055,.46,.055],mats.darkWood);
  return registerFurniture(g);
}
function makeChair(x=0,z=0,name="Lounge chair") {
  const g=new THREE.Group();g.name=name;g.position.set(x,0,z);furnitureRoot.add(g);
  roundedBox(g,"Chair seat",[0,.46,0],[.82,.16,.75],mats.cushion,.07);
  roundedBox(g,"Chair back",[0,.83,.28],[.82,.68,.15],mats.fabric,.07);
  for(const xx of [-.31,.31])for(const zz of [-.27,.27])box(g,"Chair leg",[xx,.22,zz],[.055,.44,.055],mats.darkWood);
  return registerFurniture(g);
}
function makeCabinet(x,z,name="Sideboard") {
  const g=new THREE.Group();g.name=name;g.position.set(x,0,z);furnitureRoot.add(g);
  box(g,"Cabinet body",[0,.5,0],[1.05,1,.46],mats.wood);
  for(const xx of [-.25,.25]){box(g,"Cabinet door",[xx,.51,-.24],[.47,.91,.025],mats.accent);box(g,"Handle",[xx+.13,.53,-.265],[.018,.11,.018],mats.metal);}
  box(g,"Cabinet top",[0,1.03,0],[1.1,.06,.5],mats.wood);
  for(const xx of [-.43,.43])box(g,"Cabinet foot",[xx,.06,.15],[.05,.12,.05],mats.darkWood);
  return registerFurniture(g);
}
function makeLamp(x,z) {
  const g=new THREE.Group();g.name="Floor lamp";g.position.set(x,0,z);furnitureRoot.add(g);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,1.45,16),mats.metal);stem.position.y=.73;g.add(stem);
  const shade=new THREE.Mesh(new THREE.CylinderGeometry(.24,.34,.3,32,1,true),mats.cushion);shade.position.y=1.42;g.add(shade);
  const glow=new THREE.PointLight(0xffdba1,18,4,2);glow.position.y=1.35;g.add(glow);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.055,24),mats.darkWood);base.position.y=.03;g.add(base);
  return registerFurniture(g);
}
function clearFurniture(){selectedRoot=null;pickables.length=0;while(furnitureRoot.children.length)furnitureRoot.remove(furnitureRoot.children[0]);}
function buildRoom() {
  pickables.length=0; selectedRoot=null;
  width=clamp(Number($("roomWidth").value)||5,2,20);depth=clamp(Number($("roomDepth").value)||4,2,20);height=clamp(Number($("roomHeight").value)||2.8,2,6);
  if(roomRoot)scene.remove(roomRoot);
  roomRoot=new THREE.Group();scene.add(roomRoot);furnitureRoot=new THREE.Group();furnitureRoot.name="Furniture";roomRoot.add(furnitureRoot);
  const floorGeo=new THREE.PlaneGeometry(width,depth,Math.ceil(width*2),Math.ceil(depth*2));floor=new THREE.Mesh(floorGeo,mats.floor);floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;floor.name="Floor";roomRoot.add(floor);
  box(roomRoot,"Back wall",[0,height/2,-depth/2],[width,height,.14],mats.wall);
  box(roomRoot,"Left wall",[-width/2,height/2,0],[.14,height,depth],mats.wall);
  box(roomRoot,"Right wall",[width/2,height/2,0],[.14,height,depth],mats.wall);
  // Low skirting boards make the room read as architecture rather than a box.
  for(const x of [-width/2+width/2,width/2-width/2]) {}
  box(roomRoot,"Back skirting",[0,.07,-depth/2+.08],[width,.14,.06],mats.wood);
  box(roomRoot,"Left skirting",[-width/2+.08,.07,0],[.06,.14,depth],mats.wood);
  // Window recess and four substantial wood frame pieces.
  const winW=Math.min(1.65,width*.43), winH=Math.min(1.45,height*.58), winX=-width*.19, winY=height*.64;
  box(roomRoot,"Window glass",[winX,winY,-depth/2+.095],[winW,.0+winH,.035],mats.glass);
  for(const xx of [-winW/2,winW/2])box(roomRoot,"Window jamb",[winX+xx,winY,-depth/2+.07],[.075,winH+.12,.11],mats.darkWood);
  for(const yy of [-winH/2,winH/2])box(roomRoot,"Window rail",[winX,winY+yy,-depth/2+.07],[winW+.12,.075,.11],mats.darkWood);
  box(roomRoot,"Window mullion",[winX,winY,-depth/2+.045],[.035,winH,.12],mats.white);
  box(roomRoot,"Window sill",[winX,winY-winH/2-.05,-depth/2+.02],[winW+.24,.1,.2],mats.wood);
  // Soft daylight is supported by a large area-like directional source and hemisphere fill.
  sun.position.set(-width*.4,height*1.8,depth*.3);sun.target.position.set(0,0,0);sun.target.updateMatrixWorld();
  if(windowLight){windowLight.position.set(winX,winY,-depth/2+1.15);windowLight.distance=Math.max(width,depth)*2.4;}
  camera.position.set(width*.95,height*1.08,depth*1.55);controls.target.set(0,height*.37,0);camera.far=100;camera.updateProjectionMatrix();controls.update();
  addDefaultFurniture();
  if(gridHelper){scene.remove(gridHelper);gridHelper=null;}
  gridHelper=new THREE.GridHelper(Math.max(width,depth),Math.max(8,Math.round(Math.max(width,depth)*2)),0x6f7b5c,0x5b6550);
  gridHelper.position.y=.008;gridHelper.material.transparent=true;gridHelper.material.opacity=.22;scene.add(gridHelper);gridHelper.visible=gridVisible;
  updateLighting(); lastType=$("roomType").value; lastDensity=$("density").value;
}
function addDefaultFurniture(){
  const type=$("roomType").value.toLowerCase(), density=$("density").value;
  if(type.includes("bedroom")||type.includes("kids")) {
    const bed=new THREE.Group();bed.name="Bed";bed.position.set(0,0,depth*.18);furnitureRoot.add(bed);
    box(bed,"Bed frame",[0,.25,0],[1.8,.4,2.05],mats.wood);roundedBox(bed,"Mattress",[0,.48,-.05],[1.72,.22,1.88],mats.white,.08);
    for(let i=0;i<2;i++)roundedBox(bed,"Pillow",[i?-.43:.43,.63,-.7],[.62,.14,.4],mats.cushion,.06);
    box(bed,"Headboard",[0,.77,-1.02],[1.9,.95,.12],mats.accent);registerFurniture(bed);
    makeCabinet(-width*.3,-depth*.24,"Bedside table");
  } else if(type.includes("office")) {
    makeCabinet(0,depth*.25,"Writing desk");makeChair(0,-depth*.12,"Office chair");
  } else if(type.includes("kitchen")||type.includes("dining")) {
    makeCabinet(0,depth*.2,type.includes("kitchen")?"Kitchen island":"Dining sideboard");makeChair(-1,-.3,"Dining chair");makeChair(1,-.3,"Dining chair");
  } else if(type.includes("bath")) {
    const tub=new THREE.Group();tub.name="Bathtub";tub.position.set(0,0,depth*.2);furnitureRoot.add(tub);
    roundedBox(tub,"Tub shell",[0,.27,0],[1.65,.52,.8],mats.white,.1);box(tub,"Tub interior",[0,.53,0],[1.38,.04,.57],mats.glass);registerFurniture(tub);
    makeCabinet(-width*.27,-depth*.2,"Bathroom vanity");
  } else {
    makeSofa(0,depth*.12);
    makeTable(0,-depth*.22);
    makeChair(-width*.27,-depth*.12);
  }
  if(density!=="minimal"){makePlant(width*.32,-depth*.27,.95);makeCabinet(-width*.31,-depth*.27,"Side cabinet");}
  if(density==="full"){const rugMesh=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(3,width*.72),Math.min(2,depth*.65)),mats.rug);rugMesh.rotation.x=-Math.PI/2;rugMesh.position.set(0,.012,-.12);rugMesh.receiveShadow=true;furnitureRoot.add(rugMesh);}
}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function updateLighting(){
  sun.intensity=.7+lightPower/100*2.2;ambient.intensity=.45+lightPower/100*.55;
  sun.castShadow=shadowsEnabled;renderer.shadowMap.enabled=shadowsEnabled;
  sun.shadow.bias=-.00012;sun.shadow.normalBias=.025;
  if($("lightValue"))$("lightValue").textContent=Math.round(lightPower)+"%";
  if(gridHelper)gridHelper.visible=gridVisible;
}
function select(root){
  if(selectedRoot){selectedRoot.traverse(o=>{if(o.isMesh&&originalMaterials.has(o))o.material=originalMaterials.get(o);});}
  selectedRoot=root;
  if(selectionHelper){scene.remove(selectionHelper);selectionHelper.geometry.dispose();selectionHelper=null;}
  if(root){
    selectionHelper=new THREE.BoxHelper(root,0xd8f879);scene.add(selectionHelper);
    root.traverse(o=>{if(o.isMesh){if(!originalMaterials.has(o))originalMaterials.set(o,o.material);}});
    $("selectedName").textContent=root.name;$("posX").disabled=false;$("posZ").disabled=false;$("objectScale").disabled=false;$("objectScale").value=Number(root.scale.x||1);$("objectScaleValue").textContent=Math.round((root.scale.x||1)*100)+"%";
    $("posX").value=root.position.x.toFixed(2);$("posZ").value=root.position.z.toFixed(2);
    $("addSelectedBtn").disabled=false;$("rotateStepBtn").disabled=false;$("deleteObjectBtn").disabled=false;$("deleteSelectedBtn").disabled=false;
    $("generateStatus").textContent=root.name+" selected · drag to move, use rotate mode to turn.";
  } else {
    $("selectedName").textContent="No object selected";$("posX").disabled=true;$("posZ").disabled=true;$("objectScale").disabled=true;$("objectScale").value=1;$("objectScaleValue").textContent="100%";
    $("addSelectedBtn").disabled=true;$("rotateStepBtn").disabled=true;$("deleteObjectBtn").disabled=true;$("deleteSelectedBtn").disabled=true;
  }
}
function setNotice(title,detail){const s=notice.querySelector("strong"),d=notice.querySelector("small");if(s)s.textContent=title;if(d)d.textContent=detail;}
function addCatalogObject(name){
  const lower=name.toLowerCase(),x=(Math.random()-.5)*width*.5,z=(Math.random()-.5)*depth*.5;
  let g;
  if(lower.includes("plant")||lower.includes("tree")||lower.includes("palm"))g=makePlant(furnitureRoot,x,z,1);
  else if(lower.includes("sofa")||lower.includes("couch")||lower.includes("loveseat"))g=makeSofa(x,z,name);
  else if(lower.includes("chair")||lower.includes("stool")||lower.includes("armchair"))g=makeChair(x,z,name);
  else if(lower.includes("lamp")||lower.includes("chandelier"))g=makeLamp(x,z);
  else if(lower.includes("table")||lower.includes("desk")||lower.includes("island"))g=makeTable(x,z,name);
  else if(lower.includes("bed")){g=new THREE.Group();g.name=name;g.position.set(x,0,z);furnitureRoot.add(g);box(g,"Bed frame",[0,.25,0],[1.8,.4,2],mats.wood);roundedBox(g,"Mattress",[0,.48,0],[1.72,.22,1.85],mats.white,.08);registerFurniture(g);}
  else g=makeCabinet(x,z,name);
  g.name=name;select(g);return g;
}
function setMode(next){mode=next;canvas.style.cursor=next==="move"?"move":next==="rotate"?"ew-resize":"grab";}
function init(){
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));renderer.setSize(sceneFrame.clientWidth,sceneFrame.clientHeight,false);
    renderer.physicallyCorrectLights=true;renderer.toneMappingExposure=1.05;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    scene=new THREE.Scene();scene.background=new THREE.Color(0x25291f);scene.fog=new THREE.Fog(0x25291f,22,48);
    pmremGenerator=new THREE.PMREMGenerator(renderer);environmentTexture=pmremGenerator.fromScene(new RoomEnvironment(),0.04).texture;scene.environment=environmentTexture;scene.environmentIntensity=.68;
    camera=new THREE.PerspectiveCamera(42,sceneFrame.clientWidth/sceneFrame.clientHeight,.1,100);
    makeMaterials();
    ambient=new THREE.HemisphereLight(0xe8e8d7,0x786653,.85);scene.add(ambient);
    sun=new THREE.DirectionalLight(0xffe4bc,2.1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.bias=-.00025;scene.add(sun);scene.add(sun.target);
    const fill=new THREE.DirectionalLight(0xc5d9ff,.62);fill.position.set(5,4,5);scene.add(fill);
    windowLight=new THREE.PointLight(0xffe3bd,9,12,1.65);windowLight.position.set(-1,1.8,1.5);scene.add(windowLight);
    controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=3;controls.maxDistance=18;controls.maxPolarAngle=Math.PI*.49;
    raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    setQuality($("renderQuality")?.value||"balanced");
    buildRoom();
    sceneFrame.classList.add("unity-ready");sceneFrame.classList.remove("unity-loading");
    notice.style.display="none";
    window.addEventListener("resize",resize);
    canvas.addEventListener("pointerdown",onPointerDown);window.addEventListener("pointermove",onPointerMove);window.addEventListener("pointerup",onPointerUp);
    const animate=()=>{requestAnimationFrame(animate);controls.update();if(selectionHelper)selectionHelper.update();renderer.render(scene,camera);};animate();
    setNotice("Real-time 3D ready","WebGL scene active · no Unity license required");
    window.dispatchEvent(new CustomEvent("generator3drooms:three-ready"));
  }catch(e){console.error("[Generator3DROOMS] Three.js initialization failed",e);setNotice("WebGL unavailable","Try updating the browser or enabling hardware acceleration.");}
}
function resize(){if(!renderer||!camera||renderInProgress)return;const w=sceneFrame.clientWidth,h=sceneFrame.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function onPointerDown(e){
  if(e.button!==0)return;const rect=canvas.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(pickables,true);
  if(hits.length){const root=hits[0].object.userData.selectableRoot||hits[0].object;select(root);if(mode==="move"||mode==="rotate"){const point=new THREE.Vector3();raycaster.ray.intersectPlane(dragPlane,point);drag={root,x:e.clientX,z:e.clientY,origX:root.position.x,origZ:root.position.z,offset:root.position.clone().sub(point)};controls.enabled=false;} }
  else if(mode==="select")select(null);
}
function onPointerMove(e){
  if(!drag)return;
  if(mode==="rotate"){drag.root.rotation.y+=(e.clientX-drag.x)*.012;drag.x=e.clientX;}
  else if(mode==="move"){const rect=canvas.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const point=new THREE.Vector3();if(raycaster.ray.intersectPlane(dragPlane,point)){drag.root.position.x=clamp(point.x+drag.offset.x,-width/2+.25,width/2-.25);drag.root.position.z=clamp(point.z+drag.offset.z,-depth/2+.25,depth/2-.25);}}
  $("posX").value=drag.root.position.x.toFixed(2);$("posZ").value=drag.root.position.z.toFixed(2);
}
function onPointerUp(){if(drag){drag=null;controls.enabled=true;}}
function syncRoom(){
  lightPower=Number($("lightIntensity").value);shadowsEnabled=$("shadowToggle").classList.contains("on");
  const w=Number($("roomWidth").value)||5,d=Number($("roomDepth").value)||4,h=Number($("roomHeight").value)||2.8;
  if(Math.abs(w-width)>.01||Math.abs(d-depth)>.01||Math.abs(h-height)>.01||lastType!==$("roomType").value||lastDensity!==$("density").value)buildRoom();else updateLighting();
  if(mats.wall){const style=$("roomStyle").value;if(style==="Scandinavian")mats.fabric.color.setHex(0xc0c4b6);else if(style==="Modern luxury")mats.fabric.color.setHex(0x41494b);else if(style==="Industrial")mats.fabric.color.setHex(0x777775);else if(style==="Japandi")mats.fabric.color.setHex(0xa9a18d);else mats.fabric.color.setHex(0x858b78);}
}
function generate(){buildRoom();setNotice("Room generated","Procedural layout updated · orbit, select and edit furniture");}
function setPosition(){if(!selectedRoot)return;selectedRoot.position.x=clamp(Number($("posX").value)||0,-width/2,width/2);selectedRoot.position.z=clamp(Number($("posZ").value)||0,-depth/2,depth/2);if(selectionHelper)selectionHelper.update();}
function setScale(value){if(!selectedRoot)return;const s=clamp(Number(value)||1,.25,3);selectedRoot.scale.setScalar(s);$("objectScaleValue").textContent=Math.round(s*100)+"%";if(selectionHelper)selectionHelper.update();}
function setQuality(next){quality=["balanced","high","ultra"].includes(next)?next:"balanced";const dpr=window.devicePixelRatio||1;const ratio=quality==="ultra"?Math.min(dpr,2):quality==="high"?Math.min(dpr,1.6):Math.min(dpr,1.15);if(renderer){renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=shadowsEnabled;sun.shadow.mapSize.set(quality==="ultra"?4096:quality==="high"?2048:1024);sun.shadow.needsUpdate=true;renderer.setSize(sceneFrame.clientWidth,sceneFrame.clientHeight,false);}if($("renderQuality"))$("renderQuality").value=quality;}
function export4K(){if(renderInProgress||!renderer||!scene||!camera)return;renderInProgress=true;sceneFrame.classList.add("exporting");const oldQuality=quality,oldAspect=camera.aspect,oldW=sceneFrame.clientWidth,oldH=sceneFrame.clientHeight;const max=renderer.getContext().getParameter(renderer.getContext().MAX_RENDERBUFFER_SIZE);if(max<3840){renderInProgress=false;sceneFrame.classList.remove("exporting");setNotice("4K unavailable","This GPU/browser supports a smaller render target.");notice.style.display="flex";return;}try{setQuality("ultra");renderer.setPixelRatio(1);renderer.setSize(3840,2160,false);camera.aspect=16/9;camera.updateProjectionMatrix();renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{try{if(!blob)throw new Error("Browser could not encode the 4K image");const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="Generator3DROOMS-4K.png";a.click();URL.revokeObjectURL(url);setNotice("4K image exported","3840 × 2160 PNG created by the browser renderer.");notice.style.display="flex";}catch(error){console.error(error);setNotice("4K export failed","Browser could not create the PNG image.");notice.style.display="flex";}finally{camera.aspect=oldAspect;camera.updateProjectionMatrix();setQuality(oldQuality);renderer.setSize(oldW,oldH,false);renderInProgress=false;sceneFrame.classList.remove("exporting");}}, "image/png");}catch(error){console.error("[Generator3DROOMS] 4K export failed",error);camera.aspect=oldAspect;camera.updateProjectionMatrix();setQuality(oldQuality);renderer.setSize(oldW,oldH,false);renderInProgress=false;sceneFrame.classList.remove("exporting");setNotice("4K export failed","This browser or GPU could not allocate a 4K frame.");notice.style.display="flex";}}
function deleteSelected(){if(!selectedRoot)return;const root=selectedRoot;select(null);root.parent.remove(root);for(let i=pickables.length-1;i>=0;i--)if(pickables[i].userData.selectableRoot===root)pickables.splice(i,1);}
function rotateSelected(deg=15){if(selectedRoot)selectedRoot.rotation.y+=Number(deg)*Math.PI/180;}
function toggleGrid(){gridVisible=!gridVisible;if(gridHelper)gridHelper.visible=gridVisible;return gridVisible;}
function zoomBy(factor){if(!camera||!controls)return;const offset=camera.position.clone().sub(controls.target).multiplyScalar(factor);camera.position.copy(controls.target.clone().add(offset));controls.update();}
function resetCamera(){if(!camera||!controls)return;camera.position.set(width*.95,height*1.08,depth*1.55);controls.target.set(0,height*.37,0);controls.update();}
export const api={
  load:()=>{if(!renderer)init();return Promise.resolve(true);},
  get isReady(){return !!renderer;},
  addObject:addCatalogObject,generate,syncRoom,setMode,deleteSelected,rotateSelected,setPosition,setScale,setQuality,export4K,toggleGrid,zoomBy,resetCamera,
  get selected(){return selectedRoot;}
};
init();
window.Generator3DROOMSThree=api;
