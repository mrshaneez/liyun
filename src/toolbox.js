
/* ====================================================================
   Toolbox: home screen + merge / split / organize / rotate / numbers /
   watermark / jpg→pdf / pdf→jpg
   ==================================================================== */
const IC={
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  sign:'<path d="M3 17c2-4 4-9 6-9s-1 9 1 9 3-5 5-5 1 4 3 4 2-1 3-1M3 21h18"/>',
  merge:'<path d="M8 4v5a4 4 0 0 0 4 4 4 4 0 0 1 4 4v3M16 4v5a4 4 0 0 1-2 3.5"/><path d="M5 7l3-3 3 3M13 7l3-3 3 3"/>',
  split:'<path d="M12 3v18" stroke-dasharray="2 2.5"/><rect x="3" y="5" width="6" height="14" rx="1"/><rect x="15" y="5" width="6" height="14" rx="1"/>',
  organize:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  rotate:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  numbers:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M10 16h4M12 16v-6l-1.5 1"/>',
  watermark:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  jpg2pdf:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
  pdf2jpg:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 17l3-3 2 2 3-3"/>'
};
const TOOLS=[
  {id:"edit",name:"Edit & fill PDF",dv:"ފޯމު ފުރުން",desc:"Type Dhivehi or English anywhere on a PDF, tick boxes, white-out and draw.",color:"#0b6e63",tag:"Thaana"},
  {id:"sign",name:"Sign PDF",dv:"ސޮއިކުރުން",desc:"Draw your signature and place it on any page.",color:"#2d5bd1"},
  {id:"merge",name:"Merge PDF",dv:"ގުޅުން",desc:"Combine several PDFs into one, in the order you want.",color:"#e2574c",multi:true},
  {id:"split",name:"Split PDF",dv:"ވަކިކުރުން",desc:"Pull out selected pages, or split every page into its own file.",color:"#e8873a"},
  {id:"organize",name:"Organize pages",dv:"ތަރުތީބުކުރުން",desc:"Reorder, rotate and remove pages.",color:"#7b5cd6"},
  {id:"rotate",name:"Rotate PDF",dv:"އަނބުރުން",desc:"Turn all pages, or just the ones that are sideways.",color:"#8e44ad"},
  {id:"numbers",name:"Page numbers",dv:"ސަފުހާ ނަންބަރު",desc:"Add page numbers — in English or Dhivehi (ސަފުހާ 1).",color:"#16a085",tag:"Thaana"},
  {id:"watermark",name:"Watermark",dv:"ވޯޓަރމާކު",desc:"Stamp text like ކޮޕީ or DRAFT across your pages.",color:"#2c3e50",tag:"Thaana"},
  {id:"jpg2pdf",name:"JPG to PDF",dv:"ފޮޓޯ ← PDF",desc:"Turn photos or scans into a single PDF.",color:"#d4a017",multi:true,images:true},
  {id:"pdf2jpg",name:"PDF to JPG",dv:"PDF ← ފޮޓޯ",desc:"Save every page as a JPG image.",color:"#c0392b"}
];
const svgI=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
const BRAND='<div class="brand"><div class="logo">ލ</div><div>Liyun <small>ލިޔުން</small></div></div>';

function showView(v){
  curView=v;
  ["home","tool","editor","files","admin"].forEach(n=>$(n+"View").classList.toggle("hidden",n!==v));
  $("hint").classList.toggle("hidden", v!=="editor" || !S.pdf);
  if(v!=="editor") setOsk(false);
  window.scrollTo(0,0);
}

/* ---------------- home ---------------- */
function renderHome(){
  const h=$("homeView");
  h.innerHTML=`<nav class="topnav">${BRAND}<div class="sp"></div><span class="note hide-sm">Files never leave your device</span><button class="btn ghost" id="myFilesBtn">${FICON.folder.replace("<svg ","<svg width=\"20\" height=\"20\" ")} My Files</button>${AUTH.me?`<button class="btn ghost" id="meBtn" title="Account"><span class="avatar">${esc((AUTH.me.name||AUTH.me.u).trim()[0]||"?").toUpperCase()}</span><span class="hide-sm">${esc(AUTH.me.name||AUTH.me.u)}</span></button>`:""}</nav>
  <section class="hero"><h1>Every PDF tool you need — in Dhivehi too</h1>
  <div class="dvh">ޕީޑީއެފް އާ ގުޅޭ ހުރިހާ ކަމެއް، ދިވެހިބަހުން</div>
  <p>Fill forms in Thaana, sign, merge, split, number and watermark PDFs. Everything runs right here in your browser.</p></section>
  ${S.pdf?`<div class="continue"><button id="contBtn">↩ Continue editing <b>${esc(S.name)}</b></button></div>`:""}
  <div class="grid">${TOOLS.map(t=>`<button class="card-t" data-t="${t.id}">
    <div class="ic" style="background:${t.color}">${svgI(t.id)}</div>
    <h3>${t.name}</h3><div class="dv">${t.dv}</div><p>${t.desc}</p>${t.tag?`<span class="tag">${t.tag}</span>`:""}</button>`).join("")}</div>
  <div class="privacy">No uploads, no account. Your PDFs are processed on this device only.</div>`;
  h.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>openTool(b.dataset.t));
  const c=$("contBtn"); if(c) c.onclick=()=>showView("editor");
  $("myFilesBtn").onclick=()=>openFiles();
  const me=$("meBtn"); if(me) me.onclick=()=>{ closeMenu(); const m=document.createElement("div"); m.className="fmenu"; m.id="fmenu";
    m.innerHTML=`<div class="fm-h"><b dir="auto">${esc(AUTH.me.name||"")}</b><br><span class="muted">${esc(AUTH.me.u)} · ${AUTH.me.role==="admin"?"Admin":"User"}</span></div><hr>${isAdmin()?'<button data-a="admin">Admin — manage users</button>':""}<button data-a="out">Sign out</button>`;
    document.body.append(m); const r=me.getBoundingClientRect(); m.style.left=Math.max(8,r.right-m.offsetWidth)+"px"; m.style.top=r.bottom+4+"px";
    m.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{ closeMenu(); b.dataset.a==="admin"?openAdmin():signOut(); });
    setTimeout(()=>document.addEventListener("pointerdown",menuAway,true),0); };
}
$("backBtn").onclick=()=>{ renderHome(); showView("home"); };

/* ---------------- tool routing ---------------- */
let T=null; // current tool state
function openTool(id){
  const tool=TOOLS.find(t=>t.id===id);
  if(id==="edit"||id==="sign"){
    S.pendingSign = id==="sign";
    showView("editor");
    if(S.pdf && id==="sign"){ S.pendingSign=false; setTimeout(()=>$("sigBtn").click(),100); }
    else if(!S.pdf){ $("empty").querySelector("h1").textContent = id==="sign"?"Sign a PDF":"Edit PDFs and fill forms in Dhivehi"; }
    return;
  }
  T={tool, files:[], pages:[], opts:defaultOpts(id), result:null};
  renderPicker();
  showView("tool");
}
function defaultOpts(id){
  return {
    split:{mode:"extract", ranges:"", together:true},
    numbers:{pos:"bc", fmt:"n", start:1, size:11, color:"#111111", skipFirst:false, margin:14},
    watermark:{text:"ކޮޕީ", size:60, opacity:0.18, angle:-35, color:"#c0392b", tile:false},
    jpg2pdf:{size:"a4", orient:"auto", margin:"small"},
    pdf2jpg:{dpi:150}
  }[id]||{};
}
function toolHead(){ const t=T.tool; return `<nav class="topnav"><button class="btn" id="tvBack">${svgI("rotate").replace(IC.rotate,'<path d="M15 18l-6-6 6-6"/>')} All tools</button>${BRAND}<div class="sp"></div></nav>`; }
function bindBack(){ $("tvBack").onclick=()=>{ renderHome(); showView("home"); }; }

function renderPicker(){
  const t=T.tool, v=$("toolView");
  v.innerHTML=`${toolHead()}<div class="tv-head"><h1>${t.name}</h1><div class="dvh">${t.dv}</div><p>${t.desc}</p></div>
   <div class="picker" id="picker"><button class="btn primary" id="pick">${svgI(t.images?"jpg2pdf":"pdf2jpg").replace('stroke="currentColor"','stroke="#fff"')} Select ${t.images?"images":t.multi?"PDF files":"PDF file"}</button>
   <button class="btn ghost" id="pickLib" style="margin-left:6px;font-size:16px;padding:12px 18px">From My Files</button>
   <small>or drop ${t.images?"images":"PDFs"} here</small></div>
   <input type="file" id="tvIn" hidden ${t.multi?"multiple":""} accept="${t.images?"image/*":"application/pdf,.pdf"}">`;
  bindBack();
  $("pick").onclick=()=>$("tvIn").click();
  $("pickLib").onclick=async()=>{ const rs=await pickFromLibrary({images:!!t.images, multi:!!t.multi}); if(rs.length) addToolFiles(rs.map(recToFile)); };
  $("tvIn").onchange=e=>{ addToolFiles([...e.target.files]); e.target.value=""; };
  bindDrop($("picker"));
}
function bindDrop(el){
  el.addEventListener("dragover",e=>{e.preventDefault(); el.classList.add("drag");});
  el.addEventListener("dragleave",()=>el.classList.remove("drag"));
  el.addEventListener("drop",e=>{e.preventDefault(); e.stopPropagation(); el.classList.remove("drag"); addToolFiles([...e.dataTransfer.files]);});
}
document.addEventListener("dragover",e=>{ if(curView==="tool") e.preventDefault(); });
document.addEventListener("drop",e=>{ if(curView==="tool"){ e.preventDefault(); if(e.dataTransfer.files.length) addToolFiles([...e.dataTransfer.files]); } });

function busy(on,msg){ let b=$("busy"); if(!b){ b=document.createElement("div"); b.id="busy"; b.className="busy"; b.innerHTML="<div></div>"; document.body.append(b);} b.firstChild.textContent=msg||"Working…"; b.classList.toggle("on",on); }

async function addToolFiles(list){
  const t=T.tool;
  const ok=list.filter(f=> t.images ? /^image\//.test(f.type) : (/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name)));
  if(!ok.length){ toast(t.images?"Please choose image files":"Please choose PDF files"); return; }
  const use = t.multi ? ok : ok.slice(0,1);
  if(!t.multi){ T.files=[]; T.pages=[]; }
  busy(true,"Reading files…");
  try{
    for(const f of use){
      if(t.images){
        const src=await readAsDataURL(f); const im=await loadImg(src);
        T.files.push({name:f.name, src, w:im.naturalWidth, h:im.naturalHeight, isJpg:/^data:image\/jpeg/.test(src), rot:0});
      } else {
        const bytes=new Uint8Array(await f.arrayBuffer());
        const pdf=await pdfjsLib.getDocument({data:bytes.slice(0), isEvalSupported:false}).promise;
        const fi={name:f.name, bytes, pdf, n:pdf.numPages, id:uid++};
        T.files.push(fi);
        if(!t.multi){ for(let i=1;i<=pdf.numPages;i++) T.pages.push({file:fi, i:i-1, rot:0, del:false, sel:false, key:uid++}); }
      }
    }
  }catch(e){ console.error(e); toast("Couldn't read a file: "+(e.message||e),5000); }
  busy(false);
  if(T.files.length) renderWork();
}
const readAsDataURL=f=>new Promise((r,j)=>{ const rd=new FileReader(); rd.onload=()=>r(rd.result); rd.onerror=j; rd.readAsDataURL(f); });
const loadImg=src=>new Promise((r,j)=>{ const im=new Image(); im.onload=()=>r(im); im.onerror=()=>j(new Error("Unsupported image")); im.src=src; });

async function thumbCanvas(pdf, n, maxW=150, maxH=190){
  const pg=await pdf.getPage(n); const vp0=pg.getViewport({scale:1});
  const sc=Math.min(maxW/vp0.width, maxH/vp0.height)*Math.min(2,window.devicePixelRatio||1);
  const vp=pg.getViewport({scale:sc}); const c=document.createElement("canvas"); c.width=vp.width; c.height=vp.height;
  c.style.width=vp.width/Math.min(2,window.devicePixelRatio||1)+"px";
  await pg.render({canvasContext:c.getContext("2d"),viewport:vp}).promise; return c;
}

/* ---------------- work area ---------------- */
function renderWork(){
  const t=T.tool, v=$("toolView");
  v.innerHTML=`${toolHead()}<div class="work"><div class="stage"><div class="thumbs" id="thumbs"></div></div><aside class="side" id="side"></aside></div>
   <input type="file" id="tvIn" hidden ${t.multi?"multiple":""} accept="${t.images?"image/*":"application/pdf,.pdf"}">`;
  bindBack();
  $("tvIn").onchange=e=>{ addToolFiles([...e.target.files]); e.target.value=""; };
  renderThumbs(); renderSide();
}
const ACT={
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 11a8 8 0 1 1 2.3 5.7"/><path d="M4 4v7h7"/></svg>',
  right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
  del:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  prev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>',
  next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>'
};
function renderThumbs(){
  const id=T.tool.id, box=$("thumbs"); box.innerHTML="";
  const list = (id==="merge"||id==="jpg2pdf") ? T.files : T.pages;
  list.forEach((it,idx)=>{
    const d=document.createElement("div"); d.className="th"; d.dataset.idx=idx;
    const pv=document.createElement("div"); pv.className="pv"; d.append(pv);
    let cap="", acts="";
    if(id==="merge"){ cap=`${it.name} · ${it.n} pg`; acts=`<button data-a="prev" title="Move left">${ACT.prev}</button><button data-a="next" title="Move right">${ACT.next}</button><button class="del" data-a="del" title="Remove">${ACT.del}</button>`; }
    else if(id==="jpg2pdf"){ cap=it.name; acts=`<button data-a="rotl" title="Rotate">${ACT.left}</button><button data-a="prev">${ACT.prev}</button><button data-a="next">${ACT.next}</button><button class="del" data-a="del">${ACT.del}</button>`; }
    else { cap=`Page ${idx+1}`;
      if(id==="organize"||id==="rotate") acts=`<button data-a="rotl" title="Rotate left">${ACT.left}</button><button data-a="rotr" title="Rotate right">${ACT.right}</button>`+(id==="organize"?`<button data-a="prev">${ACT.prev}</button><button data-a="next">${ACT.next}</button><button class="del" data-a="del" title="${it.del?"Restore":"Remove"}">${ACT.del}</button>`:"");
    }
    d.insertAdjacentHTML("beforeend",`<div class="cap" title="${esc(cap)}">${esc(cap)}</div><div class="acts">${acts}</div>`);
    if(it.del) d.classList.add("off");
    if(it.sel) d.classList.add("sel");
    // preview
    if(id==="jpg2pdf"){ const im=document.createElement("img"); im.src=it.src; im.style.transform=`rotate(${it.rot}deg)`; pv.append(im); }
    else {
      const f = id==="merge" ? it : it.file; const pn = id==="merge" ? 1 : it.i+1;
      thumbCanvas(f.pdf,pn).then(c=>{ c.style.transform=`rotate(${it.rot||0}deg)`; pv.prepend(c); decorateThumb(d,idx); });
    }
    d.querySelectorAll("[data-a]").forEach(b=>b.addEventListener("click",ev=>{ ev.stopPropagation(); thumbAction(b.dataset.a, idx); }));
    if(id==="split") d.addEventListener("click",()=>{ it.sel=!it.sel; d.classList.toggle("sel",it.sel); syncRangesFromSel(); });
    if(["merge","jpg2pdf","organize"].includes(id)) makeDraggable(d, list);
    box.append(d);
  });
  if(T.tool.multi){
    const add=document.createElement("button"); add.className="addmore"; add.innerHTML=`<b>+</b>Add ${T.tool.images?"images":"PDFs"}`;
    add.onclick=()=>$("tvIn").click(); box.append(add);
  }
}
function decorateThumb(d,idx){
  const id=T.tool.id, o=T.opts, pv=d.querySelector(".pv"); const c=pv.querySelector("canvas");
  pv.querySelectorAll(".badge,.wm").forEach(x=>x.remove());
  if(!c) return;
  const ch=c.offsetHeight||c.height, cw=c.offsetWidth||c.width;
  if(id==="numbers"){
    if(o.skipFirst && idx===0) return;
    const n=numLabel(idx); const b=document.createElement("div"); b.className="badge"; b.textContent=n;
    b.style.color=o.color; b.style.fontSize=Math.max(8,o.size*ch/842)+"px";
    const top=(190-ch)/2, side=(150-cw)/2;
    const mm=o.margin*ch/842; if(o.pos[0]==="t") b.style.top=top+mm+"px"; else b.style.bottom=top+mm+"px";
    if(o.pos[1]==="l"){ b.style.textAlign="left"; b.style.left=side+6+"px"; } else if(o.pos[1]==="r"){ b.style.textAlign="right"; b.style.right=side+6+"px"; }
    b.dir=textDir(n)||"ltr"; pv.append(b);
  }
  if(id==="watermark"){
    const w=document.createElement("div"); w.className="wm";
    const fs=o.size*ch/842;
    w.innerHTML=`<span dir="auto" style="font-size:${fs}px;color:${o.color};opacity:${o.opacity};transform:rotate(${o.angle}deg)">${esc(o.text)}</span>`;
    pv.append(w);
  }
}
function thumbAction(a, idx){
  const id=T.tool.id; const list=(id==="merge"||id==="jpg2pdf")?T.files:T.pages; const it=list[idx];
  if(a==="del"){ if(id==="organize"){ it.del=!it.del; } else list.splice(idx,1); if(!list.length){ renderPicker(); return; } }
  if(a==="prev" && idx>0){ [list[idx-1],list[idx]]=[list[idx],list[idx-1]]; }
  if(a==="next" && idx<list.length-1){ [list[idx+1],list[idx]]=[list[idx],list[idx+1]]; }
  if(a==="rotl") it.rot=((it.rot||0)-90+360)%360;
  if(a==="rotr") it.rot=((it.rot||0)+90)%360;
  if(a==="rotl"||a==="rotr"){ const el=$("thumbs").children[idx].querySelector("canvas,img"); if(el) el.style.transform=`rotate(${it.rot}deg)`; return; }
  renderThumbs(); renderSide();
}
function makeDraggable(d, list){
  d.draggable=true;
  d.addEventListener("dragstart",e=>{ d.classList.add("dragging"); e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/x-idx",d.dataset.idx); });
  d.addEventListener("dragend",()=>d.classList.remove("dragging"));
  d.addEventListener("dragover",e=>{ if(e.dataTransfer.types.includes("text/x-idx")){ e.preventDefault(); e.stopPropagation(); d.classList.add("over"); } });
  d.addEventListener("dragleave",()=>d.classList.remove("over"));
  d.addEventListener("drop",e=>{ const from=e.dataTransfer.getData("text/x-idx"); if(from==="") return; e.preventDefault(); e.stopPropagation(); d.classList.remove("over");
    const f=+from, to=+d.dataset.idx; if(f===to) return; const [m]=list.splice(f,1); list.splice(to,0,m); renderThumbs(); });
}

/* ---------------- side panels ---------------- */
function seg(name, options, cur){ return `<div class="seg" data-seg="${name}">${options.map(([v,l])=>`<button data-v="${v}" aria-pressed="${String(v)===String(cur)}">${l}</button>`).join("")}</div>`; }
function bindSegs(root, onSet){ root.querySelectorAll("[data-seg]").forEach(s=>s.querySelectorAll("button").forEach(b=>b.onclick=()=>{ s.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b)); onSet(s.dataset.seg,b.dataset.v); })); }

function renderSide(){
  const id=T.tool.id, o=T.opts, side=$("side"); let h=`<h2>${T.tool.name}</h2>`;
  const total=T.pages.length;
  if(id==="merge") h+=`<p class="muted">${T.files.length} file(s), ${T.files.reduce((a,f)=>a+f.n,0)} pages. Drag the cards (or use the arrows) to set the order.</p>`+(T.files.length<2?`<p class="muted" style="color:var(--danger)">Add at least one more PDF to merge.</p>`:"");
  if(id==="split") h+=`<div class="opt"><label class="t">Mode</label>${seg("mode",[["extract","Extract pages"],["ranges","By ranges"],["all","Every page"]],o.mode)}</div>
    ${o.mode!=="all"?`<div class="opt"><label class="t">${o.mode==="extract"?"Pages to extract":"Ranges (one file each)"}</label><input type="text" id="rangesIn" placeholder="${o.mode==="extract"?"e.g. 1-3, 5":"e.g. 1-2, 3-5, 6"}" value="${esc(o.ranges)}"><span class="muted">${o.mode==="extract"?"Or click pages on the left to select them.":"Each range becomes its own PDF (downloaded as a .zip)."} This PDF has ${total} pages.</span></div>`:`<p class="muted">Each of the ${total} pages becomes its own PDF, downloaded together as a .zip.</p>`}
    ${o.mode==="extract"?`<label class="chk"><input type="checkbox" id="togIn" ${o.together?"checked":""}> Merge extracted pages into one PDF</label>`:""}`;
  if(id==="organize") h+=`<p class="muted">Hover a page to rotate, move or remove it. Drag pages to reorder.</p>
    <div class="opt"><label class="t">All pages</label><div class="seg"><button id="allL">⟲ Rotate left</button><button id="allR">⟳ Rotate right</button></div></div>
    <p class="muted">${T.pages.filter(p=>p.del).length} page(s) marked for removal.</p>`;
  if(id==="rotate") h+=`<div class="opt"><label class="t">Rotate all pages</label><div class="seg"><button id="allL">⟲ Left</button><button id="allR">⟳ Right</button></div><span class="muted">Or hover a single page to rotate just that one.</span></div>`;
  if(id==="numbers") h+=`<div class="opt"><label class="t">Position</label><div class="posgrid" id="posg">${["tl","tc","tr","bl","bc","br"].map(p=>`<button data-p="${p}" aria-pressed="${o.pos===p}" title="${{t:"Top",b:"Bottom"}[p[0]]} ${{l:"left",c:"centre",r:"right"}[p[1]]}"></button>`).join("")}</div></div>
    <div class="opt"><label class="t">Format</label><select id="fmtIn">
      ${[["n","1"],["nN","1 / 12"],["pageN","Page 1 of 12"],["dv","ސަފުހާ 1"],["dvN","ސަފުހާ 1 / 12"],["dash","- 1 -"]].map(([v,l])=>`<option value="${v}" dir="${textDir(l)||"ltr"}" ${o.fmt===v?"selected":""}>${l}</option>`).join("")}</select></div>
    <div class="opt" style="flex-direction:row;gap:10px"><div style="flex:1"><label class="t">Start at</label><input type="number" id="startIn" min="0" value="${o.start}"></div><div style="flex:1"><label class="t">Size</label><input type="number" id="nsizeIn" min="6" max="40" value="${o.size}"></div><div><label class="t">Colour</label><br><input type="color" id="ncolIn" value="${o.color}"></div></div>
    <div class="opt"><label class="t">Distance from edge (pt)</label><input type="number" id="marIn" min="0" max="200" value="${o.margin}"></div>
    <label class="chk"><input type="checkbox" id="skipIn" ${o.skipFirst?"checked":""}> Don't number the first page (cover)</label>`;
  if(id==="watermark") h+=`<div class="opt"><label class="t">Text</label><input type="text" id="wmIn" data-dv autocapitalize="${S.dv?"off":"sentences"}" autocorrect="off" autocomplete="off" spellcheck="false" value="${esc(o.text)}" dir="auto" style="font-family:Faruma,Arial,Helvetica,sans-serif;font-size:16px">
     <span class="muted">Typing follows the Dhivehi/English switch: <button class="btn ghost" id="wmKb" style="padding:2px 8px;min-height:0">${S.dv?"ދިވެހި":"EN"}</button></span></div>
    <div class="opt" style="flex-direction:row;gap:10px"><div style="flex:1"><label class="t">Size</label><input type="number" id="wmSize" min="10" max="200" value="${o.size}"></div><div style="flex:1"><label class="t">Angle</label><input type="number" id="wmAng" min="-90" max="90" value="${o.angle}"></div><div><label class="t">Colour</label><br><input type="color" id="wmCol" value="${o.color}"></div></div>
    <div class="opt"><label class="t">Transparency</label><input type="range" id="wmOp" min="0.05" max="1" step="0.05" value="${o.opacity}"></div>
    <label class="chk"><input type="checkbox" id="wmTile" ${o.tile?"checked":""}> Repeat across the page</label>`;
  if(id==="jpg2pdf") h+=`<p class="muted">${T.files.length} image(s) — one per page. Drag to reorder.</p>
    <div class="opt"><label class="t">Page size</label>${seg("size",[["a4","A4"],["letter","Letter"],["fit","Same as image"]],o.size)}</div>
    ${o.size!=="fit"?`<div class="opt"><label class="t">Orientation</label>${seg("orient",[["auto","Auto"],["p","Portrait"],["l","Landscape"]],o.orient)}</div>`:""}
    <div class="opt"><label class="t">Margin</label>${seg("margin",[["none","None"],["small","Small"],["big","Big"]],o.margin)}</div>`;
  if(id==="pdf2jpg") h+=`<p class="muted">${total} page(s) will be saved as JPG images${total>1?" in a .zip file":""}.</p>
    <div class="opt"><label class="t">Quality</label>${seg("dpi",[["100","Normal"],["150","Good"],["300","High"]],o.dpi)}</div>`;
  const label={merge:"Merge PDF",split:"Split PDF",organize:"Save PDF",rotate:"Save PDF",numbers:"Add page numbers",watermark:"Add watermark",jpg2pdf:"Convert to PDF",pdf2jpg:"Convert to JPG"}[id];
  h+=`<button class="btn primary go" id="goBtn" ${id==="merge"&&T.files.length<2?"disabled":""}>${label} →</button>`;
  side.innerHTML=h;
  bindSegs(side,(k,v)=>{ o[k]= (k==="dpi")?+v:v; renderSide(); if(id==="split") syncSelFromRanges(); });
  const on=(i,ev,fn)=>{ const el=$(i); if(el) el.addEventListener(ev,fn); };
  on("rangesIn","input",e=>{ o.ranges=e.target.value; syncSelFromRanges(); });
  on("togIn","change",e=>o.together=e.target.checked);
  on("allL","click",()=>{ T.pages.forEach(p=>p.rot=(p.rot-90+360)%360); refreshRot(); });
  on("allR","click",()=>{ T.pages.forEach(p=>p.rot=(p.rot+90)%360); refreshRot(); });
  side.querySelectorAll("#posg [data-p]").forEach(b=>b.onclick=()=>{ o.pos=b.dataset.p; renderSide(); redecorate(); });
  on("fmtIn","change",e=>{ o.fmt=e.target.value; redecorate(); });
  on("startIn","input",e=>{ o.start=+e.target.value||0; redecorate(); });
  on("nsizeIn","input",e=>{ o.size=+e.target.value||11; redecorate(); });
  on("ncolIn","input",e=>{ o.color=e.target.value; redecorate(); });
  on("marIn","input",e=>{ o.margin=+e.target.value||0; redecorate(); });
  on("skipIn","change",e=>{ o.skipFirst=e.target.checked; redecorate(); });
  on("wmIn","input",e=>{ o.text=e.target.value; redecorate(); });
  on("wmKb","mousedown",e=>e.preventDefault());
  on("wmKb","click",()=>{ setDv(!S.dv); $("wmKb").textContent=S.dv?"ދިވެހި":"EN"; });
  on("wmSize","input",e=>{ o.size=+e.target.value||60; redecorate(); });
  on("wmAng","input",e=>{ o.angle=+e.target.value||0; redecorate(); });
  on("wmCol","input",e=>{ o.color=e.target.value; redecorate(); });
  on("wmOp","input",e=>{ o.opacity=+e.target.value; redecorate(); });
  on("wmTile","change",e=>{ o.tile=e.target.checked; });
  $("goBtn").onclick=runTool;
}
function refreshRot(){ [...$("thumbs").children].forEach((d,i)=>{ const el=d.querySelector("canvas"); if(el && T.pages[i]) el.style.transform=`rotate(${T.pages[i].rot}deg)`; }); }
function redecorate(){ [...$("thumbs").children].forEach((d,i)=>{ if(d.classList.contains("th")) decorateThumb(d,i); }); }
function numLabel(idx){
  const o=T.opts; const first=o.skipFirst?1:0; const n=o.start+(idx-first); const N=o.start+(T.pages.length-1-first);
  return ({n:`${n}`, nN:`${n} / ${N}`, pageN:`Page ${n} of ${N}`, dv:`ސަފުހާ ${n}`, dvN:`ސަފުހާ ${n} / ${N}`, dash:`- ${n} -`})[o.fmt];
}
function parseRanges(str,max){
  const out=[]; for(const part of str.split(/[,;\s]+/).filter(Boolean)){
    const m=part.match(/^(\d*)\s*-\s*(\d*)$/); let a,b;
    if(m){ a=m[1]?+m[1]:1; b=m[2]?+m[2]:max; } else if(/^\d+$/.test(part)){ a=b=+part; } else throw new Error(`"${part}" isn't a page or range`);
    if(a<1||b>max||a>b) throw new Error(`Range ${part} is outside 1–${max}`);
    out.push([a,b]); }
  return out;
}
function syncRangesFromSel(){
  const idx=T.pages.map((p,i)=>p.sel?i+1:0).filter(Boolean); const rs=[]; let s=null,prev=null;
  for(const i of idx){ if(s===null){s=prev=i;} else if(i===prev+1) prev=i; else { rs.push(s===prev?`${s}`:`${s}-${prev}`); s=prev=i; } }
  if(s!==null) rs.push(s===prev?`${s}`:`${s}-${prev}`);
  T.opts.ranges=rs.join(", "); const el=$("rangesIn"); if(el) el.value=T.opts.ranges;
}
function syncSelFromRanges(){
  let rs=[]; try{ rs=parseRanges(T.opts.ranges||"",T.pages.length); }catch(e){}
  T.pages.forEach((p,i)=>{ p.sel = T.opts.mode!=="all" && rs.some(([a,b])=>i+1>=a&&i+1<=b); });
  [...$("thumbs").children].forEach((d,i)=>{ if(T.pages[i]) d.classList.toggle("sel",T.pages[i].sel); });
}

/* ---------------- running tools ---------------- */
async function runTool(){
  const {PDFDocument, degrees} = PDFLib; const id=T.tool.id, o=T.opts;
  busy(true,"Processing…");
  try{
    let out;   // {blob, name}
    const base=(T.files[0]?.name||"file").replace(/\.(pdf|jpe?g|png|webp|gif|heic)$/i,"");
    const load=bytes=>PDFDocument.load(bytes,{ignoreEncryption:true});
    if(id==="merge"){
      const doc=await PDFDocument.create();
      for(const f of T.files){ const src=await load(f.bytes); const cp=await doc.copyPages(src,src.getPageIndices()); cp.forEach(p=>doc.addPage(p)); }
      out={blob:pdfBlob(await doc.save()), name:"merged.pdf"};
    }
    if(id==="organize"||id==="rotate"){
      const src=await load(T.files[0].bytes); const doc=await PDFDocument.create();
      const keep=T.pages.filter(p=>!p.del); if(!keep.length) throw new Error("All pages are marked for removal");
      const cp=await doc.copyPages(src, keep.map(p=>p.i));
      cp.forEach((pg,k)=>{ const r=keep[k].rot; if(r) pg.setRotation(degrees((pg.getRotation().angle+r)%360)); doc.addPage(pg); });
      out={blob:pdfBlob(await doc.save()), name:`${base}-${id==="rotate"?"rotated":"organized"}.pdf`};
    }
    if(id==="split"){
      const src=await load(T.files[0].bytes); const n=src.getPageCount();
      let groups;
      if(o.mode==="all") groups=[...Array(n)].map((_,i)=>[i]);
      else { const rs=parseRanges(o.ranges||"",n); if(!rs.length) throw new Error("Choose the pages to extract first");
        const toIdx=([a,b])=>[...Array(b-a+1)].map((_,k)=>a-1+k);
        groups = (o.mode==="extract" && o.together) ? [rs.flatMap(toIdx)] : rs.map(toIdx); }
      const make=async idxs=>{ const d=await PDFDocument.create(); (await d.copyPages(src,idxs)).forEach(p=>d.addPage(p)); return d.save(); };
      if(groups.length===1){ out={blob:pdfBlob(await make(groups[0])), name:`${base}-pages-${label(groups[0])}.pdf`}; }
      else { const zip=new JSZip(); for(const g of groups) zip.file(`${base}-pages-${label(g)}.pdf`, await make(g)); out={blob:await zip.generateAsync({type:"blob"}), name:`${base}-split.zip`}; }
    }
    if(id==="numbers"){
      const doc=await load(T.files[0].bytes); const pages=doc.getPages();
      for(let i=0;i<pages.length;i++){
        if(o.skipFirst && i===0) continue;
        const txt=numLabel(i); const pg=pages[i];
        await stampText(doc,pg,txt,{size:o.size,color:o.color,pos:o.pos,margin:o.margin});
      }
      out={blob:pdfBlob(await doc.save()), name:`${base}-numbered.pdf`};
    }
    if(id==="watermark"){
      if(!o.text.trim()) throw new Error("Type the watermark text first");
      const doc=await load(T.files[0].bytes);
      const w=measureText(o.text,o.size,true)+8, h=o.size*1.5;
      const png=await doc.embedPng(await textToPng(o.text,{size:o.size,bold:true,color:o.color,dir:textDir(o.text)||"ltr",w,h,padX:4,padY:0,lineHeight:h}));
      for(const pg of doc.getPages()){
        const {x:vx,y:vy,width:W,height:H}=visibleBox(pg);
        const spots = o.tile ? tileSpots(W,H,w,h) : [[W/2,H/2]];
        for(const [cx,cy] of spots) drawRotatedImage(pg, png, vx+cx, vy+cy, w, h, o.angle, o.opacity);
      }
      out={blob:pdfBlob(await doc.save()), name:`${base}-watermarked.pdf`};
    }
    if(id==="jpg2pdf"){
      const doc=await PDFDocument.create();
      const SZ={a4:[595.28,841.89], letter:[612,792]}; const M={none:0,small:20,big:50}[o.margin];
      for(const f of T.files){
        let src=f.src, w=f.w, h=f.h;
        if(f.rot || !/^data:image\/(png|jpeg)/.test(src)){ const r=await rotateToDataURL(f); src=r.src; w=r.w; h=r.h; }
        const bytes=Uint8Array.from(atob(src.split(",")[1]),c=>c.charCodeAt(0));
        const im=/^data:image\/jpeg/.test(src)?await doc.embedJpg(bytes):await doc.embedPng(bytes);
        let PW,PH;
        if(o.size==="fit"){ PW=w*0.75+2*M; PH=h*0.75+2*M; }
        else { [PW,PH]=SZ[o.size]; const land = o.orient==="l" || (o.orient==="auto" && w>h); if(land) [PW,PH]=[PH,PW]; }
        const pg=doc.addPage([PW,PH]); const sc=Math.min((PW-2*M)/w,(PH-2*M)/h); const dw=w*sc, dh=h*sc;
        pg.drawImage(im,{x:(PW-dw)/2,y:(PH-dh)/2,width:dw,height:dh});
      }
      out={blob:pdfBlob(await doc.save()), name:`${T.files.length>1?"images":base}.pdf`};
    }
    if(id==="pdf2jpg"){
      const pdf=T.files[0].pdf; const sc=o.dpi/72; const blobs=[];
      for(let i=1;i<=pdf.numPages;i++){
        busy(true,`Rendering page ${i} of ${pdf.numPages}…`);
        const pg=await pdf.getPage(i); const vp=pg.getViewport({scale:sc}); const c=document.createElement("canvas"); c.width=vp.width; c.height=vp.height;
        const g=c.getContext("2d"); g.fillStyle="#fff"; g.fillRect(0,0,c.width,c.height);
        await pg.render({canvasContext:g,viewport:vp}).promise;
        blobs.push(await new Promise(r=>c.toBlob(r,"image/jpeg",0.9))); c.width=c.height=0;
      }
      if(blobs.length===1) out={blob:blobs[0], name:`${base}.jpg`};
      else { const zip=new JSZip(); blobs.forEach((b,i)=>zip.file(`${base}-page-${String(i+1).padStart(2,"0")}.jpg`,b)); out={blob:await zip.generateAsync({type:"blob"}), name:`${base}-jpg.zip`}; }
    }
    busy(false);
    T.result=out; renderDone();
    saveFile(out.blob,out.name);
  }catch(e){ busy(false); console.error(e); toast(e.message||String(e),5000); }
}
const pdfBlob=b=>new Blob([b],{type:"application/pdf"});
const label=g=>{ const a=g[0]+1,b=g[g.length-1]+1; return g.length===1?`${a}`:(b-a+1===g.length?`${a}-${b}`:`${a}-etc`); };
function measureText(t,size,bold){ const c=measureText.c||(measureText.c=document.createElement("canvas").getContext("2d")); c.font=`${bold?700:400} ${size}px Faruma, Arial, Helvetica, sans-serif`; return Math.max(...t.split("\n").map(l=>c.measureText(l).width)); }
function visibleBox(pg){ const r=pg.getRotation().angle%360; const b=pg.getCropBox(); return {x:b.x,y:b.y,width:b.width,height:b.height,rot:r}; }
function tileSpots(W,H,w,h){ const sx=Math.max(w*1.1,140), sy=Math.max(h*3,120), pts=[]; let row=0; for(let y=sy/2;y<H;y+=sy,row++) for(let x=(row%2?sx:sx/2);x<W+sx/2;x+=sx) pts.push([x,y]); return pts; }
function drawRotatedImage(pg,img,cx,cy,w,h,angDeg,opacity){
  // rotate about centre; pdf-lib rotates about the (x,y) origin (counter-clockwise)
  const a=(-angDeg)*Math.PI/180; const pageRot=pg.getRotation().angle%360; const tot=a+pageRot*Math.PI/180;
  const ox=cx-(w/2*Math.cos(tot)-h/2*Math.sin(tot)), oy=cy-(w/2*Math.sin(tot)+h/2*Math.cos(tot));
  pg.drawImage(img,{x:ox,y:oy,width:w,height:h,rotate:PDFLib.radians(tot),opacity});
}
async function stampText(doc,pg,txt,o){
  const dir=textDir(txt)||"ltr"; const w=measureText(txt,o.size,false)+6, h=o.size*1.5;
  const png=await doc.embedPng(await textToPng(txt,{size:o.size,bold:false,color:o.color,dir,w,h,padX:3,padY:0,lineHeight:h}));
  const box=visibleBox(pg); const r=box.rot;
  // work in "visual" coordinates (as the page is displayed), then map to user space
  const VW=(r%180)?box.height:box.width, VH=(r%180)?box.width:box.height, m=o.margin;
  const vx = o.pos[1]==="l"? m : o.pos[1]==="r"? VW-m-w : (VW-w)/2;
  const vyTop = o.pos[0]==="t"? m : VH-m-h;                      // top of label from visual top
  const [cx,cy]=visToUser(box, vx+w/2, vyTop+h/2);
  const rad=r*Math.PI/180;
  const ox=cx-(w/2*Math.cos(rad)-h/2*Math.sin(rad)), oy=cy-(w/2*Math.sin(rad)+h/2*Math.cos(rad));
  pg.drawImage(png,{x:ox,y:oy,width:w,height:h,rotate:PDFLib.degrees(r)});
}
function visToUser(b,vx,vy){
  // visual (x right, y down) → PDF user space, for /Rotate 0/90/180/270 (clockwise display)
  switch(b.rot){
    case 90:  return [b.x+vy, b.y+vx];
    case 180: return [b.x+b.width-vx, b.y+vy];
    case 270: return [b.x+b.width-vy, b.y+b.height-vx];
    default:  return [b.x+vx, b.y+b.height-vy];
  }
}
async function rotateToDataURL(f){
  const im=await loadImg(f.src); const r=f.rot%360; const c=document.createElement("canvas");
  const sw=im.naturalWidth, sh=im.naturalHeight; c.width=(r%180)?sh:sw; c.height=(r%180)?sw:sh;
  const g=c.getContext("2d"); g.translate(c.width/2,c.height/2); g.rotate(r*Math.PI/180); g.drawImage(im,-sw/2,-sh/2);
  return {src:c.toDataURL(f.isJpg?"image/jpeg":"image/png",0.92), w:c.width, h:c.height};
}

function renderDone(){
  const r=T.result, isPdf=/\.pdf$/.test(r.name), v=$("toolView");
  v.innerHTML=`${toolHead()}<div class="done"><div class="ok">✓</div><h2>Your file is ready</h2>
   <p>${esc(r.name)} · ${(r.blob.size/1024/1024).toFixed(2)} MB</p>
   <div class="btns"><button class="btn primary" id="dlAgain">Download again</button><button class="btn ghost" id="toLib">Save to My Files</button>
   ${isPdf?`<button class="btn ghost" id="toEditor">Edit / fill this PDF</button>`:""}
   <button class="btn ghost" id="again">Back to ${esc(T.tool.name)}</button><button class="btn ghost" id="homeB">All tools</button></div></div>`;
  bindBack();
  $("dlAgain").onclick=()=>saveFile(r.blob,r.name);
  $("toLib").onclick=async()=>{ const x=await askSaveTo(r.name, FV.folder||""); if(!x||!x.value) return; let nm=x.value; const ext=(r.name.match(/\.[^.]+$/)||[""])[0]; if(ext && !nm.toLowerCase().endsWith(ext)) nm+=ext;
    try{ const rec=await saveBlobToLibrary(r.blob, nm, {folder:x.folder||null}); toast(`Saved “${rec.name}” to My Files`); }catch(e){ toast("Couldn't save: "+(e.message||e),5000); } };
  $("again").onclick=()=>{ T.result=null; renderWork(); };
  $("homeB").onclick=()=>{ renderHome(); showView("home"); };
  const te=$("toEditor"); if(te) te.onclick=async()=>{ showView("editor"); await openFile(new File([r.blob],r.name,{type:"application/pdf"}),true); };
}

