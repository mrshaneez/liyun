
/* ====================================================================
   My Files — a small file library kept in this browser (IndexedDB)
   records: {id, kind:"folder"|"file", name, parent, created, modified,
             blob?, size?, mime?, project?:{orig:Blob, items:[...]}}
   ==================================================================== */
const LIB=(()=>{
  let dbp=null;
  function open(){
    if(dbp) return dbp;
    dbp=new Promise((res,rej)=>{
      let rq; try{ rq=indexedDB.open("liyun",1); }catch(e){ rej(e); return; }
      rq.onupgradeneeded=()=>{ const st=rq.result.createObjectStore("items",{keyPath:"id"}); st.createIndex("parent","parent"); };
      rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error);
    });
    return dbp;
  }
  async function tx(mode,fn){ const db=await open(); return new Promise((res,rej)=>{ const t=db.transaction("items",mode); const st=t.objectStore("items"); let out; Promise.resolve(fn(st)).then(v=>out=v); t.oncomplete=()=>res(out); t.onerror=()=>rej(t.error); t.onabort=()=>rej(t.error||new Error("Storage refused (the browser may be full or in private mode)")); }); }
  const req=r=>new Promise((res,rej)=>{ r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
  const nid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  return {
    async all(){ return tx("readonly",st=>req(st.getAll())); },
    async get(id){ return tx("readonly",st=>req(st.get(id))); },
    async put(rec){ rec.modified=Date.now(); if(!rec.id){ rec.id=nid(); rec.created=rec.modified; } await tx("readwrite",st=>req(st.put(rec))); return rec; },
    async del(id){ const all=await this.all(); const kill=new Set([id]); let grew=true;
      while(grew){ grew=false; for(const r of all) if(!kill.has(r.id) && kill.has(r.parent)){ kill.add(r.id); grew=true; } }
      await tx("readwrite",st=>{ kill.forEach(k=>st.delete(k)); }); return kill.size; },
    ok: typeof indexedDB!=="undefined"
  };
})();
try{ navigator.storage && navigator.storage.persist && navigator.storage.persist(); }catch(e){}

const FICON={
  folder:'<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#f2b84b"/></svg>',
  pdf:'<svg viewBox="0 0 24 24"><path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#e2574c"/><path d="M14 2v5h5" fill="#f4a9a2"/><text x="12" y="17.5" font-size="5.5" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">PDF</text></svg>',
  img:'<svg viewBox="0 0 24 24"><path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#3a8fd6"/><path d="M14 2v5h5" fill="#a9cdf0"/><path d="M7 18l3-4 2 2.5 2-2.5 3 4z" fill="#fff"/></svg>',
  zip:'<svg viewBox="0 0 24 24"><path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#7d8a97"/><path d="M14 2v5h5" fill="#c3ccd5"/><path d="M10 4h2v2h-2zM12 6h2v2h-2zM10 8h2v2h-2zM12 10h2v2h-2zM10 13h4v4h-4z" fill="#fff"/></svg>',
  other:'<svg viewBox="0 0 24 24"><path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#9aa6b2"/><path d="M14 2v5h5" fill="#d5dbe1"/></svg>'
};
const ftype=r=> r.kind==="folder"?"folder": /pdf/.test(r.mime||"")||/\.pdf$/i.test(r.name)?"pdf": /^image\//.test(r.mime||"")?"img": /zip/.test(r.mime||"")||/\.zip$/i.test(r.name)?"zip":"other";
const fsize=n=> n==null?"": n<1024?n+" B": n<1048576?(n/1024).toFixed(0)+" KB": (n/1048576).toFixed(1)+" MB";
const fdate=t=>{ const d=new Date(t), now=new Date(); return d.toDateString()===now.toDateString()? d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : d.toLocaleDateString([], {day:"numeric",month:"short",year: d.getFullYear()===now.getFullYear()?undefined:"numeric"}); };
const mimeOf=name=> /\.pdf$/i.test(name)?"application/pdf": /\.zip$/i.test(name)?"application/zip": /\.jpe?g$/i.test(name)?"image/jpeg": /\.png$/i.test(name)?"image/png":"";

/* ---------------- dialog helper (prompt/confirm are blocked in frames) ---------------- */
function dialog({title, body="", input=null, folder=undefined, buttons=[["Cancel",null],["OK","ok","primary"]]}){
  return new Promise(async resolve=>{
    let m=$("dlgModal"); if(!m){ m=document.createElement("div"); m.id="dlgModal"; m.className="modal"; document.body.append(m); }
    let folderOpts="";
    if(folder!==undefined){ const all=(await LIB.all()).filter(r=>r.kind==="folder"); folderOpts=folderPaths(all).map(([id,path])=>`<option value="${id}" ${id===folder?"selected":""}>${esc(path)}</option>`).join(""); }
    m.innerHTML=`<div class="card" role="dialog"><h3>${esc(title)}</h3>${body?`<p style="margin:0 0 10px;color:var(--muted)">${body}</p>`:""}
      ${input!==null?`<input class="dlg-in" id="dlgIn" type="text" value="${esc(input)}" dir="auto" autocomplete="off" autocapitalize="off" spellcheck="false">`:""}
      ${folder!==undefined?`<label class="dlg-l">Folder</label><select class="dlg-in" id="dlgFolder">${folderOpts}</select>`:""}
      <div class="row-end">${buttons.map(([l,v,c],i)=>`<button class="btn ${c||"ghost"}" data-i="${i}">${l}</button>`).join("")}</div></div>`;
    m.classList.add("on");
    const inp=$("dlgIn");
    if(inp){ inp.focus(); const dot=inp.value.lastIndexOf("."); inp.setSelectionRange(0, dot>0?dot:inp.value.length); }
    else { const fs=$("dlgFolder"); const pb=m.querySelector(".btn.primary,.btn.danger"); (fs||pb||m.querySelector("button")).focus(); }
    const done=v=>{ m.classList.remove("on"); resolve(v===null?null:{action:v, value:inp?inp.value.trim():null, folder:$("dlgFolder")?($("dlgFolder").value||null):null}); };
    m.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>done(buttons[+b.dataset.i][1]));
    m.onkeydown=e=>{ if(e.key==="Escape") done(null); if(e.key==="Enter" && e.target.tagName!=="BUTTON"){ const pr=buttons.findIndex(b=>b[2]==="primary"||b[2]==="danger"); done(buttons[pr>=0?pr:buttons.length-1][1]); } };
    m.onpointerdown=e=>{ if(e.target===m) done(null); };
  });
}
function folderPaths(folders){
  const byId=Object.fromEntries(folders.map(f=>[f.id,f]));
  const path=f=>{ const parts=[]; let c=f, guard=0; while(c && guard++<50){ parts.unshift(c.name); c=byId[c.parent]; } return parts.join(" / "); };
  return [["","My Files"], ...folders.map(f=>[f.id,"My Files / "+path(f)]).sort((a,b)=>a[1].localeCompare(b[1]))];
}
function uniqueName(name, siblings, selfId){
  const taken=new Set(siblings.filter(s=>s.id!==selfId).map(s=>s.name.toLowerCase()));
  if(!taken.has(name.toLowerCase())) return name;
  const m=name.match(/^(.*?)(\.[^.]+)?$/); let i=2; while(taken.has(`${m[1]} (${i})${m[2]||""}`.toLowerCase())) i++;
  return `${m[1]} (${i})${m[2]||""}`;
}
async function siblingsOf(parent){ return (await LIB.all()).filter(r=>(r.parent||null)===(parent||null)); }

/* ---------------- save helpers used by editor & tools ---------------- */
async function saveBlobToLibrary(blob, name, {folder=null, project=null, id=null}={}){
  if(!LIB.ok) throw new Error("This browser can't store files");
  const sib=await siblingsOf(folder);
  const rec = id ? Object.assign(await LIB.get(id)||{}, {}) : {kind:"file"};
  rec.kind="file"; rec.parent=folder||null; rec.name=uniqueName(name, sib, rec.id); rec.blob=blob; rec.size=blob.size; rec.mime=blob.type||mimeOf(name);
  if(project) rec.project=project; else delete rec.project;
  await LIB.put(rec); return rec;
}
async function askSaveTo(defaultName, defaultFolder){
  return dialog({title:"Save to My Files", input:defaultName, folder:defaultFolder||"", buttons:[["Cancel",null],["Save","save","primary"]]});
}

// Editor: save (keeps your edits re-editable)
function editorProject(){
  return { orig:new Blob([S.file],{type:"application/pdf"}),
    items:S.items.map(i=>{ const o={...i}; delete o.el; delete o._before; return o; }),
    deleted:S.pages.map(p=>p.deleted) };
}
async function editorSave(){
  if(!S.pdf) return;
  if(document.activeElement && document.activeElement.blur) document.activeElement.blur();
  let target=null, name=S.name, folder=S.libFolder||"";
  if(S.libId){
    const r=await dialog({title:`Save “${S.name}”`, body:"Your typing, ticks and signatures stay editable — you can open it again from My Files and carry on.",
      buttons:[["Cancel",null],["Save as a copy…","copy"],["Save","over","primary"]]});
    if(!r) return;
    if(r.action==="over") target=S.libId;
  }
  if(!target){
    const r=await askSaveTo(S.name.replace(/(-filled)?\.pdf$/i,"")+".pdf", folder);
    if(!r || !r.value) return;
    name=/\.pdf$/i.test(r.value)?r.value:r.value+".pdf"; folder=r.folder||null;
  }
  busy(true,"Saving…");
  try{
    const bytes=await buildPdf();
    const rec=await saveBlobToLibrary(new Blob([bytes],{type:"application/pdf"}), name, {folder: target? S.libFolder : folder, project:editorProject(), id:target});
    S.libId=rec.id; S.libFolder=rec.parent; S.name=rec.name; S.dirty=false; document.title=rec.name+" — Liyun";
    busy(false); toast(`Saved to My Files${rec.parent?"":""} as “${rec.name}”`);
  }catch(e){ busy(false); console.error(e); toast("Couldn't save: "+(e.message||e),5000); }
}

// Open a library record in the editor (restoring editable items if present)
async function openRecordInEditor(rec){
  showView("editor");
  const src = rec.project ? rec.project.orig : rec.blob;
  await openFile(new File([src], rec.name, {type:"application/pdf"}), true);
  if(!S.pdf) return;
  if(rec.project){
    const fields=S.items.filter(i=>i.type==="field");
    const savedFields=rec.project.items.filter(i=>i.type==="field");
    savedFields.forEach((sf,k)=>{ const f=fields[k]; if(f && f.name===sf.name){ f.value=sf.value; restoreField(f); } });
    for(const it of rec.project.items){ if(it.type==="field") continue; const o={...it}; o.id=uid++; o.el=null; S.items.push(o); renderItem(o); }
    (rec.project.deleted||[]).forEach((d,i)=>{ const P=S.pages[i]; if(P && d){ P.deleted=true; P.el.classList.add("deleted"); const b=P.el.parentElement.querySelector(".pagebar button"); if(b) b.textContent="Restore page"; } });
  }
  S.libId=rec.id; S.libFolder=rec.parent||null; S.name=rec.name; S.dirty=false; S.history=[];
  document.title=rec.name+" — Liyun";
}

/* ---------------- My Files view ---------------- */
let FV={folder:null, q:"", sel:new Set()};
async function openFiles(folder){
  if(folder!==undefined) FV.folder=folder;
  showView("files"); await renderFiles();
}
async function renderFiles(){
  const v=$("filesView");
  let all=[]; try{ all=await LIB.all(); }catch(e){ v.innerHTML=`<nav class="topnav">${BRAND}</nav><div class="done"><h2>Storage isn't available</h2><p>This browser blocked local storage (private mode?). My Files needs it.</p></div>`; return; }
  const byId=Object.fromEntries(all.map(r=>[r.id,r]));
  if(FV.folder && !byId[FV.folder]) FV.folder=null;
  const crumbs=[]; let c=byId[FV.folder]; while(c){ crumbs.unshift(c); c=byId[c.parent]; }
  const q=FV.q.trim().toLowerCase();
  let list = q ? all.filter(r=>r.name.toLowerCase().includes(q)) : all.filter(r=>(r.parent||null)===FV.folder);
  list.sort((a,b)=> (a.kind===b.kind?0:a.kind==="folder"?-1:1) || a.name.localeCompare(b.name,undefined,{numeric:true}));
  const pathOf=r=>{ const p=[]; let x=byId[r.parent]; while(x){ p.unshift(x.name); x=byId[x.parent]; } return p.length?p.join(" / "):"My Files"; };
  const totalSize=all.reduce((a,r)=>a+(r.size||0),0);
  const count=r=>all.filter(x=>x.parent===r.id).length;
  FV.sel.forEach(id=>{ if(!byId[id]) FV.sel.delete(id); });
  v.innerHTML=`<nav class="topnav"><button class="btn" id="fvHome"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg> All tools</button>${BRAND}<div class="sp"></div><span class="note">${all.filter(r=>r.kind==="file").length} files · ${fsize(totalSize)}</span></nav>
  <div class="fv">
    <div class="fv-top">
      <div class="crumbs"><button data-f="">My Files</button>${crumbs.map(f=>`<span>›</span><button data-f="${f.id}">${esc(f.name)}</button>`).join("")}</div>
      <div class="sp"></div>
      <input type="search" id="fvQ" placeholder="Search all files" value="${esc(FV.q)}" dir="auto" autocapitalize="off">
      <button class="btn ghost" id="fvNew"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 11v5M9.5 13.5h5"/></svg>New folder</button>
      <button class="btn primary" id="fvUp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9M7 14l5-5 5 5M5 3h14"/></svg>Add files</button>
    </div>
    ${FV.sel.size?`<div class="fv-bulk"><b>${FV.sel.size} selected</b><button class="btn ghost" id="bMove">Move to…</button><button class="btn ghost" id="bDel" style="color:var(--danger)">Delete</button><button class="btn" id="bClear">Clear</button></div>`:""}
    <div class="fv-list" id="fvList">
      ${list.length?`<div class="fv-row fv-h"><span></span><span></span><span>Name</span><span class="c-sz">Size</span><span class="c-dt">Modified</span><span></span></div>`:""}
      ${list.map(r=>`<div class="fv-row" data-id="${r.id}" draggable="true">
        <input type="checkbox" class="fv-ck" ${FV.sel.has(r.id)?"checked":""} aria-label="Select">
        <span class="fv-ic">${FICON[ftype(r)]}</span>
        <span class="fv-nm"><span class="fv-name" dir="auto">${esc(r.name)}</span>${r.project?`<span class="pill" title="Your edits can be continued">editable</span>`:""}${q?`<small>${esc(pathOf(r))}</small>`:""}</span>
        <span class="c-sz">${r.kind==="folder"?count(r)+" item"+(count(r)===1?"":"s"):fsize(r.size)}</span>
        <span class="c-dt">${fdate(r.modified)}</span>
        <button class="fv-more" aria-label="More actions">⋯</button>
      </div>`).join("")}
      ${!list.length?`<div class="fv-empty">${q?"No files match your search.":`<b>This folder is empty</b><br>Save a PDF here from the editor or any tool, or drop files onto this page.`}</div>`:""}
    </div>
    <p class="fv-note">Files are kept in this browser on this device only. Clearing your browser data removes them — download anything important.</p>
  </div>
  <input type="file" id="fvIn" multiple hidden accept="application/pdf,.pdf,image/*,.zip">`;
  $("fvHome").onclick=()=>{ renderHome(); showView("home"); };
  v.querySelectorAll(".crumbs [data-f]").forEach(b=>{ b.onclick=()=>{ FV.folder=b.dataset.f||null; FV.q=""; FV.sel.clear(); renderFiles(); }; dropTarget(b, b.dataset.f||null); });
  const qi=$("fvQ"); qi.oninput=()=>{ FV.q=qi.value; clearTimeout(qi._t); qi._t=setTimeout(async()=>{ const pos=qi.selectionStart; await renderFiles(); const n=$("fvQ"); n.focus(); n.setSelectionRange(pos,pos); },150); };
  $("fvNew").onclick=newFolder;
  $("fvUp").onclick=()=>$("fvIn").click();
  $("fvIn").onchange=e=>{ importFiles([...e.target.files]); e.target.value=""; };
  if($("bClear")){ $("bClear").onclick=()=>{ FV.sel.clear(); renderFiles(); }; $("bMove").onclick=()=>moveItems([...FV.sel]); $("bDel").onclick=()=>deleteItems([...FV.sel]); }
  v.querySelectorAll(".fv-row[data-id]").forEach(row=>{
    const r=byId[row.dataset.id];
    row.querySelector(".fv-ck").onclick=e=>{ e.stopPropagation(); e.target.checked?FV.sel.add(r.id):FV.sel.delete(r.id); renderFiles(); };
    row.querySelector(".fv-more").onclick=e=>{ e.stopPropagation(); fileMenu(r, e.currentTarget); };
    row.onclick=e=>{ if(e.target.closest("input,button")) return; openItem(r); };
    row.oncontextmenu=e=>{ e.preventDefault(); fileMenu(r, row.querySelector(".fv-more")); };
    row.addEventListener("dragstart",e=>{ const ids=FV.sel.has(r.id)?[...FV.sel]:[r.id]; e.dataTransfer.setData("text/x-lib",JSON.stringify(ids)); e.dataTransfer.effectAllowed="move"; row.classList.add("dragging"); });
    row.addEventListener("dragend",()=>row.classList.remove("dragging"));
    if(r.kind==="folder") dropTarget(row, r.id);
  });
}
function dropTarget(el, folderId){
  el.addEventListener("dragover",e=>{ if(e.dataTransfer.types.includes("text/x-lib")){ e.preventDefault(); e.stopPropagation(); el.classList.add("over"); } });
  el.addEventListener("dragleave",()=>el.classList.remove("over"));
  el.addEventListener("drop",async e=>{ const d=e.dataTransfer.getData("text/x-lib"); if(!d) return; e.preventDefault(); e.stopPropagation(); el.classList.remove("over"); await doMove(JSON.parse(d), folderId); });
}
document.addEventListener("dragover",e=>{ if(curView==="files" && e.dataTransfer.types.includes("Files")) e.preventDefault(); });
document.addEventListener("drop",e=>{ if(curView==="files" && e.dataTransfer.files.length){ e.preventDefault(); importFiles([...e.dataTransfer.files]); } });

async function importFiles(files){
  if(!files.length) return;
  busy(true,"Adding files…");
  try{ for(const f of files){ await saveBlobToLibrary(f.slice(0,f.size,f.type||mimeOf(f.name)), f.name, {folder:FV.folder}); } toast(`Added ${files.length} file${files.length>1?"s":""}`); }
  catch(e){ toast("Couldn't add files: "+(e.message||e),5000); }
  busy(false); renderFiles();
}
async function newFolder(){
  const r=await dialog({title:"New folder", input:"New folder", buttons:[["Cancel",null],["Create","ok","primary"]]});
  if(!r||!r.value) return;
  const sib=await siblingsOf(FV.folder);
  await LIB.put({kind:"folder", name:uniqueName(r.value,sib), parent:FV.folder});
  renderFiles();
}
async function renameItem(r){
  const res=await dialog({title:r.kind==="folder"?"Rename folder":"Rename file", input:r.name, buttons:[["Cancel",null],["Rename","ok","primary"]]});
  if(!res||!res.value||res.value===r.name) return;
  let nm=res.value; if(r.kind==="file"){ const ext=(r.name.match(/\.[^.]+$/)||[""])[0]; if(ext && !/\.[^.]+$/.test(nm)) nm+=ext; }
  const sib=await siblingsOf(r.parent); r.name=uniqueName(nm,sib,r.id); await LIB.put(r);
  if(S.libId===r.id){ S.name=r.name; }
  renderFiles(); toast("Renamed");
}
async function moveItems(ids){
  const all=await LIB.all(); const first=all.find(x=>x.id===ids[0]);
  const res=await dialog({title:`Move ${ids.length>1?ids.length+" items":"“"+esc(first?.name||"")+"”"}`, folder:first?.parent||"", buttons:[["Cancel",null],["Move here","ok","primary"]]});
  if(!res) return; await doMove(ids, res.folder||null);
}
async function doMove(ids, folderId){
  const all=await LIB.all(); const byId=Object.fromEntries(all.map(r=>[r.id,r]));
  let moved=0, skipped=0;
  for(const id of ids){ const r=byId[id]; if(!r) continue;
    // a folder can't go inside itself
    let c=byId[folderId], bad=false; while(c){ if(c.id===id){ bad=true; break; } c=byId[c.parent]; }
    if(bad || (r.parent||null)===(folderId||null)){ skipped++; continue; }
    const sib=all.filter(x=>(x.parent||null)===(folderId||null)); r.name=uniqueName(r.name,sib,r.id); r.parent=folderId||null; await LIB.put(r); all.push(r); moved++; }
  FV.sel.clear(); renderFiles(); if(moved) toast(`Moved ${moved} item${moved>1?"s":""}`);
}
async function deleteItems(ids){
  const all=await LIB.all(); const rs=all.filter(r=>ids.includes(r.id)); const hasFolder=rs.some(r=>r.kind==="folder");
  const res=await dialog({title:`Delete ${rs.length>1?rs.length+" items":"“"+rs[0].name+"”"}?`, body: hasFolder?"Folders are deleted together with everything inside them. This can't be undone.":"This can't be undone.", buttons:[["Cancel",null],["Delete","ok","danger"]]});
  if(!res) return; let n=0; for(const id of ids) n+=await LIB.del(id);
  if(S.libId && !(await LIB.get(S.libId))) S.libId=null;
  FV.sel.clear(); renderFiles(); toast(`Deleted ${n} item${n>1?"s":""}`);
}
async function openItem(r){
  if(r.kind==="folder"){ FV.folder=r.id; FV.q=""; FV.sel.clear(); return renderFiles(); }
  const t=ftype(r);
  if(t==="pdf") return openRecordInEditor(r);
  if(t==="img") return previewImage(r);
  saveFile(r.blob, r.name);
}
function previewImage(r){
  const url=URL.createObjectURL(r.blob);
  dialog({title:r.name, body:`<img src="${url}" alt="" style="max-width:100%;max-height:60vh;display:block;margin:auto;border-radius:8px">`, buttons:[["Close",null],["Download","dl","primary"]]})
    .then(x=>{ URL.revokeObjectURL(url); if(x&&x.action==="dl") saveFile(r.blob,r.name); });
}
function fileMenu(r, anchor){
  closeMenu();
  const t=ftype(r); const m=document.createElement("div"); m.className="fmenu"; m.id="fmenu";
  const items=[];
  if(r.kind==="folder") items.push(["Open",()=>openItem(r)]);
  if(t==="pdf"){ items.push([r.project?"Continue editing":"Open in editor",()=>openRecordInEditor(r)]);
    items.push(["sep"]); [["sign","Sign"],["merge","Merge with…"],["split","Split"],["organize","Organize pages"],["numbers","Add page numbers"],["watermark","Watermark"],["pdf2jpg","Convert to JPG"]].forEach(([id,l])=>items.push([l,()=>openToolWith(id,[r])])); items.push(["sep"]); }
  if(t==="img"){ items.push(["View",()=>previewImage(r)],["Convert to PDF",()=>openToolWith("jpg2pdf",[r])],["sep"]); }
  if(r.kind==="file") items.push(["Download",()=>saveFile(r.blob,r.name)]);
  items.push(["Rename",()=>renameItem(r)],["Move to…",()=>moveItems([r.id])]);
  if(r.kind==="file") items.push(["Duplicate",async()=>{ const c={...r}; delete c.id; const sib=await siblingsOf(r.parent); c.name=uniqueName(r.name.replace(/(\.[^.]+)?$/," copy$1"),sib); await LIB.put(c); renderFiles(); }]);
  items.push(["sep"],["Delete",()=>deleteItems([r.id]),"danger"]);
  m.innerHTML=items.map(([l,,c],i)=>l==="sep"?`<hr>`:`<button data-i="${i}" class="${c||""}">${l}</button>`).join("");
  document.body.append(m);
  const a=anchor.getBoundingClientRect(); const mw=m.offsetWidth, mh=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(innerWidth-mw-8, a.right-mw))+"px";
  m.style.top=(a.bottom+mh+8>innerHeight? Math.max(8,a.top-mh-4) : a.bottom+4)+"px";
  m.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ closeMenu(); items[+b.dataset.i][1](); });
  setTimeout(()=>document.addEventListener("pointerdown",menuAway,true),0);
}
function menuAway(e){ if(!e.target.closest("#fmenu")) closeMenu(); }
function closeMenu(){ const m=$("fmenu"); m&&m.remove(); document.removeEventListener("pointerdown",menuAway,true); }
addEventListener("scroll",closeMenu,{passive:true});

/* ---------------- pick from My Files (used by tools & editor) ---------------- */
const recToFile=r=>new File([r.blob], r.name, {type:r.mime||mimeOf(r.name)});
async function openToolWith(id, recs){
  if(id==="sign"||id==="edit"){ await openRecordInEditor(recs[0]); if(id==="sign") setTimeout(()=>$("sigBtn").click(),200); return; }
  openTool(id); await addToolFiles(recs.map(recToFile));
}
async function pickFromLibrary({images=false, multi=false}={}){
  const all=await LIB.all(); const byId=Object.fromEntries(all.map(r=>[r.id,r]));
  let folder=null; const chosen=new Set();
  return new Promise(resolve=>{
    let m=$("pickModal"); if(!m){ m=document.createElement("div"); m.id="pickModal"; m.className="modal"; document.body.append(m); }
    const fits=r=> r.kind==="folder" || (images ? ftype(r)==="img" : ftype(r)==="pdf");
    const draw=()=>{
      const crumbs=[]; let c=byId[folder]; while(c){ crumbs.unshift(c); c=byId[c.parent]; }
      const list=all.filter(r=>(r.parent||null)===folder && fits(r)).sort((a,b)=>(a.kind===b.kind?0:a.kind==="folder"?-1:1)||a.name.localeCompare(b.name,undefined,{numeric:true}));
      m.innerHTML=`<div class="card" style="width:min(620px,100%)"><h3>Choose from My Files</h3>
        <div class="crumbs"><button data-f="">My Files</button>${crumbs.map(f=>`<span>›</span><button data-f="${f.id}">${esc(f.name)}</button>`).join("")}</div>
        <div class="pick-list">${list.map(r=>`<div class="fv-row pk" data-id="${r.id}">${r.kind==="folder"?"<span></span>":`<input type="checkbox" class="fv-ck" ${chosen.has(r.id)?"checked":""}>`}<span class="fv-ic">${FICON[ftype(r)]}</span><span class="fv-nm"><span class="fv-name" dir="auto">${esc(r.name)}</span></span><span class="c-sz">${r.kind==="folder"?"":fsize(r.size)}</span></div>`).join("")||`<div class="fv-empty">No ${images?"images":"PDFs"} here.</div>`}</div>
        <div class="row-end"><span class="muted" style="margin-right:auto;align-self:center">${chosen.size?chosen.size+" selected":""}</span><button class="btn ghost" data-x="c">Cancel</button><button class="btn primary" data-x="ok" ${chosen.size?"":"disabled"}>Use ${chosen.size>1?chosen.size+" files":"file"}</button></div></div>`;
      m.querySelectorAll(".crumbs [data-f]").forEach(b=>b.onclick=()=>{ folder=b.dataset.f||null; draw(); });
      m.querySelectorAll(".pk").forEach(row=>row.onclick=()=>{ const r=byId[row.dataset.id];
        if(r.kind==="folder"){ folder=r.id; return draw(); }
        if(!multi) chosen.clear(); chosen.has(r.id)?chosen.delete(r.id):chosen.add(r.id); draw(); });
      m.querySelector('[data-x="c"]').onclick=()=>{ m.classList.remove("on"); resolve([]); };
      m.querySelector('[data-x="ok"]').onclick=()=>{ m.classList.remove("on"); resolve([...chosen].map(id=>byId[id])); };
    };
    draw(); m.classList.add("on");
  });
}

$("libSaveBtn").onclick=editorSave;
$("openLib").onclick=async()=>{ const rs=await pickFromLibrary({}); if(rs[0]) openRecordInEditor(rs[0]); };
renderHome(); showView("home");
authStart();
