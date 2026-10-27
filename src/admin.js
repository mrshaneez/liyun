
/* ====================================================================
   Sign-in gate + Admin (users.json in the GitHub repo, PBKDF2 hashes)
   ==================================================================== */
const AUTH={ users:null, sha:null, me:null, dirty:false };
const AUTH_KEY="liyun.session", GH_KEY="liyun.gh";
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
async function hashPw(pw, saltHex){
  const salt=Uint8Array.from(saltHex.match(/../g).map(h=>parseInt(h,16)));
  const key=await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({name:"PBKDF2", salt, iterations:150000, hash:"SHA-256"}, key, 256));
}
const newSalt=()=>hex(crypto.getRandomValues(new Uint8Array(16)));
const lsGet=k=>{ try{ return JSON.parse(localStorage.getItem(k)||"null"); }catch(e){ return null; } };
const lsSet=(k,v)=>{ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
const normU=u=>String(u||"").trim().toLowerCase();

async function loadUsers(){
  const r=await fetch("users.json?ts="+Date.now(), {cache:"no-store"});
  if(!r.ok) throw new Error("users.json missing ("+r.status+")");
  const j=await r.json(); return Array.isArray(j.users)?j.users:[];
}

/* ---------------- gate UI ---------------- */
function gate(html){
  let g=$("gate"); if(!g){ g=document.createElement("div"); g.id="gate"; document.body.append(g); }
  document.body.classList.add("locked");
  g.innerHTML=`<div class="gate-card"><div class="brand" style="justify-content:center;margin-bottom:6px"><div class="logo">ލ</div><div>Liyun <small>ލިޔުން</small></div></div>${html}</div>`;
  return g;
}
function unlock(){ document.body.classList.remove("locked"); const g=$("gate"); g&&g.remove(); renderHome(); showView(curView||"home"); }

async function authStart(){
  let users;
  try{ users=await loadUsers(); }
  catch(e){ gate(`<h2>Can't check sign-in</h2><p class="gm">The user list couldn't be loaded. Check your connection and reload.</p><button class="btn primary" onclick="location.reload()">Reload</button>`); return; }
  AUTH.users=users;
  const pending=lsGet("liyun.pendingUsers");      // admin's own unpublished changes on this device
  if(!users.length && !(pending&&pending.length)) return setupScreen();
  const sess=lsGet(AUTH_KEY);
  const list = users.length ? users : pending;
  if(sess){
    const u=list.find(x=>x.u===sess.u);
    if(u && u.active!==false && u.hash===sess.h && Date.now()<sess.exp){ AUTH.me=u; return unlock(); }
    lsSet(AUTH_KEY,null);
    if(u && u.active===false) return loginScreen("Your account has been blocked. Contact the admin.");
  }
  loginScreen();
}
function loginScreen(msg){
  const g=gate(`<h2>Sign in</h2><p class="gm">ސައިން އިން ކުރައްވާ</p>
    <form id="lf"><input id="lu" placeholder="Username" autocomplete="username" autocapitalize="off" spellcheck="false" required>
    <input id="lp" type="password" placeholder="Password" autocomplete="current-password" required>
    <label class="chk gm2"><input type="checkbox" id="lr" checked> Keep me signed in on this device</label>
    <div class="gerr" id="le">${msg?esc(msg):""}</div>
    <button class="btn primary" style="width:100%;justify-content:center;padding:11px">Sign in</button></form>
    <p class="gm2">No account? Ask the admin to add you.</p>`);
  $("lu").focus();
  $("lf").onsubmit=async e=>{
    e.preventDefault(); const btn=g.querySelector("button.primary"); btn.disabled=true; btn.textContent="Checking…";
    const list=AUTH.users.length?AUTH.users:(lsGet("liyun.pendingUsers")||[]);
    const u=list.find(x=>x.u===normU($("lu").value));
    let ok=false; if(u){ ok=(await hashPw($("lp").value,u.salt))===u.hash; }
    btn.disabled=false; btn.textContent="Sign in";
    if(!ok){ $("le").textContent="Wrong username or password."; return; }
    if(u.active===false){ $("le").textContent="This account is blocked. Contact the admin."; return; }
    AUTH.me=u; lsSet(AUTH_KEY,{u:u.u,h:u.hash,exp:Date.now()+($("lr").checked?30:1)*864e5});
    unlock(); toast(`Welcome, ${u.name||u.u}`);
  };
}
function setupScreen(){
  const g=gate(`<h2>Set up Liyun</h2><p class="gm">No accounts exist yet. Create the first <b>admin</b> account. It becomes active once it's saved to GitHub (next step).</p>
    <form id="sf"><input id="sn" placeholder="Your name" required><input id="su" placeholder="Username" autocapitalize="off" spellcheck="false" required pattern="[A-Za-z0-9._\\-]{3,30}" title="3–30 letters, numbers, . _ -">
    <input id="sp" type="password" placeholder="Password (min 8 characters)" minlength="8" required autocomplete="new-password">
    <input id="sp2" type="password" placeholder="Repeat password" minlength="8" required autocomplete="new-password">
    <div class="gerr" id="se"></div><button class="btn primary" style="width:100%;justify-content:center;padding:11px">Create admin</button></form>`);
  $("sf").onsubmit=async e=>{
    e.preventDefault(); if($("sp").value!==$("sp2").value){ $("se").textContent="Passwords don't match."; return; }
    const salt=newSalt(); const u={u:normU($("su").value), name:$("sn").value.trim(), role:"admin", active:true, salt, hash:await hashPw($("sp").value,salt), created:new Date().toISOString()};
    AUTH.users=[u]; AUTH.me=u; AUTH.dirty=true; lsSet("liyun.pendingUsers",AUTH.users);
    lsSet(AUTH_KEY,{u:u.u,h:u.hash,exp:Date.now()+30*864e5});
    unlock(); openAdmin(); toast("Admin created — now publish it to GitHub to switch sign-in on");
  };
}
function signOut(){ lsSet(AUTH_KEY,null); AUTH.me=null; location.reload(); }
const isAdmin=()=>AUTH.me && AUTH.me.role==="admin";

/* ---------------- admin page ---------------- */
async function openAdmin(){
  if(!isAdmin()) return;
  const pend=lsGet("liyun.pendingUsers");
  if(pend && pend.length){ AUTH.users=pend; AUTH.dirty=true; }
  showView("admin"); renderAdmin();
}
function renderAdmin(){
  const v=$("adminView"), gh=lsGet(GH_KEY)||{repo:"mrshaneez/liyun",branch:"main",token:""};
  const users=[...AUTH.users].sort((a,b)=>(a.role===b.role?0:a.role==="admin"?-1:1)||a.u.localeCompare(b.u));
  const admins=AUTH.users.filter(u=>u.role==="admin"&&u.active!==false).length;
  v.innerHTML=`<nav class="topnav"><button class="btn" id="adBack"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg> All tools</button>${BRAND}<div class="sp"></div><span class="note">Admin</span></nav>
  <div class="fv">
    ${AUTH.dirty?`<div class="pub"><div><b>Unpublished changes</b><br><span>Users can't sign in with these changes until you publish them.</span></div><button class="btn ghost" id="adDl">Download users.json</button><button class="btn primary" id="adPub">Publish to GitHub</button></div>`:""}
    <div class="fv-top"><div class="crumbs"><button>Users</button></div><div class="sp"></div><span class="muted">${users.length} account${users.length===1?"":"s"}</span><button class="btn primary" id="adAdd">+ Add user</button></div>
    <div class="fv-list">
      <div class="fv-row fv-h ad"><span>Name</span><span>Username</span><span>Role</span><span>Status</span><span></span></div>
      ${users.map(u=>`<div class="fv-row ad" data-u="${esc(u.u)}"><span class="fv-name" dir="auto">${esc(u.name||"")}${AUTH.me.u===u.u?' <span class="pill">you</span>':""}</span><span class="mono">${esc(u.u)}</span>
        <span>${u.role==="admin"?'<span class="pill adm">Admin</span>':"User"}</span><span>${u.active===false?'<span class="pill blk">Blocked</span>':'<span class="pill ok">Active</span>'}</span>
        <button class="fv-more" aria-label="Actions">⋯</button></div>`).join("")}
    </div>
    <details class="ghset" ${gh.token?"":"open"}><summary>GitHub publishing settings ${gh.token?"✓":""}</summary>
      <p class="muted">Publishing saves <code>users.json</code> to your repo; Vercel then redeploys (about a minute). Create a <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">fine-grained token</a> with access to <b>only this repository</b> and <b>Contents: Read and write</b>. It's stored only in this browser.</p>
      <div class="ghgrid"><label>Repository<input id="ghRepo" value="${esc(gh.repo)}"></label><label>Branch<input id="ghBr" value="${esc(gh.branch)}"></label>
      <label style="grid-column:1/-1">Token<input id="ghTok" type="password" value="${esc(gh.token)}" placeholder="github_pat_…" autocomplete="off"></label></div>
      <div class="row-end" style="margin-top:6px">${gh.token?`<button class="btn ghost" id="ghForget">Forget token</button>`:""}<button class="btn ghost" id="ghSave">Save settings</button></div>
    </details>
    <p class="fv-note">Admins can manage users. Note: sign-in hides the app from casual visitors; it isn't bank-grade security (the site is static), and everyone's PDFs still stay on their own device.</p>
  </div>`;
  $("adBack").onclick=()=>{ renderHome(); showView("home"); };
  $("adAdd").onclick=addUser;
  if($("adPub")){ $("adPub").onclick=publishUsers; $("adDl").onclick=()=>saveFile(new Blob([usersJson()],{type:"application/json"}),"users.json"); }
  $("ghSave").onclick=()=>{ lsSet(GH_KEY,{repo:$("ghRepo").value.trim(),branch:$("ghBr").value.trim()||"main",token:$("ghTok").value.trim()}); toast("Settings saved on this device"); renderAdmin(); };
  if($("ghForget")) $("ghForget").onclick=()=>{ lsSet(GH_KEY,{...gh,token:""}); renderAdmin(); };
  v.querySelectorAll(".fv-row.ad[data-u]").forEach(row=>{ const u=AUTH.users.find(x=>x.u===row.dataset.u);
    const open=e=>{ e.stopPropagation(); userMenu(u,row.querySelector(".fv-more"),admins); };
    row.querySelector(".fv-more").onclick=open; row.onclick=open; });
}
function stage(){ AUTH.dirty=true; lsSet("liyun.pendingUsers",AUTH.users); renderAdmin(); }
function usersJson(){ return JSON.stringify({version:1, note:"Liyun accounts. Passwords are PBKDF2-SHA256 hashes. Edit via the Admin page.", users:AUTH.users},null,2)+"\n"; }
function userMenu(u, anchor, admins){
  closeMenu(); const m=document.createElement("div"); m.className="fmenu"; m.id="fmenu";
  const lastAdmin = u.role==="admin" && u.active!==false && admins<=1;
  const items=[["Reset password…",()=>resetPw(u)],["Rename…",()=>renameUser(u)]];
  if(u.role==="admin"){ if(!lastAdmin) items.push(["Make regular user",()=>{u.role="user";stage();}]); } else items.push(["Make admin",()=>{u.role="admin";stage();}]);
  if(u.u!==AUTH.me.u && !lastAdmin) items.push(u.active===false?["Unblock",()=>{u.active=true;stage();}]:["Block",()=>{u.active=false;stage();}]);
  if(u.u!==AUTH.me.u && !lastAdmin) items.push(["sep"],["Delete account",async()=>{ const r=await dialog({title:`Delete “${u.u}”?`,body:"They won't be able to sign in. Their files stay on their own device.",buttons:[["Cancel",null],["Delete","ok","danger"]]}); if(r){ AUTH.users=AUTH.users.filter(x=>x!==u); stage(); } },"danger"]);
  m.innerHTML=items.map(([l,,c],i)=>l==="sep"?"<hr>":`<button data-i="${i}" class="${c||""}">${l}</button>`).join("");
  document.body.append(m); const a=anchor.getBoundingClientRect();
  m.style.left=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,a.right-m.offsetWidth))+"px"; m.style.top=(a.bottom+m.offsetHeight+8>innerHeight?Math.max(8,a.top-m.offsetHeight-4):a.bottom+4)+"px";
  m.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ closeMenu(); items[+b.dataset.i][1](); });
  setTimeout(()=>document.addEventListener("pointerdown",menuAway,true),0);
}
function userForm(title, {name="",user="",withUser=true,withName=true,pw=true,role=false}={}){
  return new Promise(res=>{
    let m=$("dlgModal"); if(!m){ m=document.createElement("div"); m.id="dlgModal"; m.className="modal"; document.body.append(m); }
    m.innerHTML=`<div class="card"><h3>${esc(title)}</h3><form id="uf" class="uform">
      ${withName?`<label>Full name<input id="ufN" value="${esc(name)}" dir="auto" required></label>`:""}
      ${withUser?`<label>Username<input id="ufU" value="${esc(user)}" autocapitalize="off" spellcheck="false" required pattern="[A-Za-z0-9._\\-]{3,30}" title="3–30 letters, numbers, . _ -"></label>`:""}
      ${pw?`<label>Password <span class="muted">(min 8 characters — share it with them privately)</span><div style="display:flex;gap:6px"><input id="ufP" type="text" minlength="8" required autocomplete="off" style="flex:1"><button type="button" class="btn ghost" id="ufG">Generate</button></div></label>`:""}
      ${role?`<label class="chk"><input type="checkbox" id="ufA"> Admin (can manage users)</label>`:""}
      <div class="gerr" id="ufE"></div>
      <div class="row-end"><button type="button" class="btn ghost" id="ufC">Cancel</button><button class="btn primary">Save</button></div></form></div>`;
    m.classList.add("on");
    const gen=()=>{ const a="abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const r=crypto.getRandomValues(new Uint8Array(10)); $("ufP").value=[...r].map(x=>a[x%a.length]).join(""); };
    if(pw){ $("ufG").onclick=gen; }
    (m.querySelector("input")||{}).focus?.();
    $("ufC").onclick=()=>{ m.classList.remove("on"); res(null); };
    $("uf").onsubmit=e=>{ e.preventDefault();
      const out={name:$("ufN")?.value.trim(), u:$("ufU")?normU($("ufU").value):null, pw:$("ufP")?.value, admin:$("ufA")?.checked};
      if(out.u!==null && out.u!==user && AUTH.users.some(x=>x.u===out.u)){ $("ufE").textContent="That username is taken."; return; }
      m.classList.remove("on"); res(out); };
  });
}
async function addUser(){
  const f=await userForm("Add user",{role:true}); if(!f) return;
  const salt=newSalt(); AUTH.users.push({u:f.u,name:f.name,role:f.admin?"admin":"user",active:true,salt,hash:await hashPw(f.pw,salt),created:new Date().toISOString()});
  stage(); toast(`Added ${f.u} — publish to make it live`);
}
async function resetPw(u){
  const f=await userForm(`New password for ${u.u}`,{withUser:false,withName:false}); if(!f) return;
  u.salt=newSalt(); u.hash=await hashPw(f.pw,u.salt); stage();
  if(u.u===AUTH.me.u) lsSet(AUTH_KEY,{u:u.u,h:u.hash,exp:Date.now()+30*864e5});
}
async function renameUser(u){ const f=await userForm(`Rename ${u.u}`,{name:u.name,withUser:false,pw:false}); if(!f) return; u.name=f.name; stage(); }

async function publishUsers(){
  const gh=lsGet(GH_KEY)||{};
  if(!gh.token||!gh.repo){ toast("Add your GitHub token in the settings below first",4000); const d=document.querySelector(".ghset"); if(d) d.open=true; return; }
  busy(true,"Publishing to GitHub…");
  try{
    const api=`https://api.github.com/repos/${gh.repo}/contents/users.json`;
    const H={Authorization:"Bearer "+gh.token, Accept:"application/vnd.github+json"};
    let sha; const cur=await fetch(api+"?ref="+encodeURIComponent(gh.branch||"main"),{headers:H,cache:"no-store"});
    if(cur.ok) sha=(await cur.json()).sha; else if(cur.status!==404) throw new Error(ghErr(cur.status));
    const body={message:`Update users (${AUTH.me.u} via Liyun admin)`, content:btoa(unescape(encodeURIComponent(usersJson()))), branch:gh.branch||"main"}; if(sha) body.sha=sha;
    const r=await fetch(api,{method:"PUT",headers:{...H,"Content-Type":"application/json"},body:JSON.stringify(body)});
    if(!r.ok) throw new Error(ghErr(r.status));
    AUTH.dirty=false; lsSet("liyun.pendingUsers",null); busy(false); renderAdmin();
    dialog({title:"Published ✓",body:"users.json was saved to GitHub. Vercel is redeploying — changes are live in about a minute.",buttons:[["OK","ok","primary"]]});
  }catch(e){ busy(false); toast("Publish failed: "+(e.message||e),6000); }
}
function ghErr(s){ return s===401?"the token is invalid or expired": s===403?"the token doesn't have Contents write access to this repo": s===404?"repository not found (check the name, and that the token can access it)": s===409||s===422?"the file changed on GitHub — reload and try again":"GitHub error "+s; }
