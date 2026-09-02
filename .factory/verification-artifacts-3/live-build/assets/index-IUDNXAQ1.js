(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function a(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(s){if(s.ep)return;s.ep=!0;const i=a(s);fetch(s.href,i)}})();const m=6,M=[{id:"mote",name:"Mote",cells:[[0,0],[1,0],[0,1]],color:"#f2c45f",mutates:null},{id:"nook",name:"Nook",cells:[[0,0],[1,0],[0,1],[1,1]],color:"#ff7a6e",mutates:"mote"},{id:"wing",name:"Wing",cells:[[0,0],[1,0],[2,0],[0,1]],color:"#7fc6c8",mutates:"nook"},{id:"crown",name:"Crown",cells:[[1,0],[0,1],[1,1],[2,1],[1,2]],color:"#b9d66b",mutates:"wing"},{id:"crook",name:"Crook",cells:[[0,0],[1,0],[1,1],[2,1]],color:"#cf9ce8",mutates:"crown"}],Z={mote:[[0,0],[1,0],[0,1]],nook:[[1,1],[2,1],[1,2],[2,2]],wing:[[3,0],[4,0],[5,0],[3,1]],crown:[[3,2],[2,3],[3,3],[4,3],[3,4]],crook:[[0,3],[1,3],[1,4],[2,4]]},X="2026-08-14";function J(e){let t=2166136261;for(const a of e)t^=a.charCodeAt(0),t=Math.imul(t,16777619);return t>>>0}function Q(e=new Date){return e.toISOString().slice(0,10)}function q(e){const t=Math.min(...e.map(([r])=>r)),a=Math.min(...e.map(([,r])=>r));return e.map(([r,s])=>[r-t,s-a]).sort(([r,s],[i,n])=>s-n||r-i)}function T(e){return q(e).map(([t,a])=>`${t},${a}`).join("|")}function k(e,t,a){let r=e.map(([s,i])=>[a?-s:s,i]);for(let s=0;s<(t%4+4)%4;s+=1)r=r.map(([i,n])=>[-n,i]);return q(r)}function V(e,t,a){return e.map(([r,s])=>{let i=a?m-1-r:r,n=s;for(let l=0;l<t;l+=1)[i,n]=[m-1-n,i];return[i,n]})}function g(e){const t=J(e),a=t%4,r=(t>>>3&1)===1,s=M.map((i,n)=>{const l=V(Z[i.id],a,r);return{...i,cells:[...i.cells],habitat:l,targetSignature:T(l),rotation:(t>>>n*3+1)%4,flipped:(t>>>n*3+2&1)===1,placed:!1,mutation:null}});return{date:e,seed:t,pieces:s,selected:null,moves:[],score:0,undos:0,cursor:[0,0],finished:!1}}function f(e){return T(k(e.cells,e.rotation,e.flipped))===e.targetSignature}function C(e,t){return e.selected?{...e,pieces:e.pieces.map(a=>a.id===e.selected&&!a.placed?{...a,rotation:(a.rotation+t+4)%4}:a)}:e}function O(e){return e.selected?{...e,pieces:e.pieces.map(t=>t.id===e.selected&&!t.placed?{...t,flipped:!t.flipped}:t)}:e}function z(e,t){if(!e.selected)return{state:e,error:"select"};const a=e.pieces.find(l=>l.id===e.selected);if(e.pieces.find(l=>l.id===t).placed)return{state:e,error:"occupied"};if(a.id!==t)return{state:e,error:"wrong-habitat"};if(!f(a))return{state:e,error:"orientation"};const s=a.mutates===null||e.pieces.some(l=>l.id===a.mutates&&l.placed),i=e.pieces.map(l=>l.id===a.id?{...l,placed:!0,mutation:s}:l),n=[...e.moves,{id:a.id,mutation:s}];return{state:{...e,pieces:i,selected:null,moves:n,score:e.score+(s?1:0),finished:n.length===M.length}}}function ee(e){const t=e.moves.at(-1);return t?{...e,pieces:e.pieces.map(a=>a.id===t.id?{...a,placed:!1,mutation:null}:a),moves:e.moves.slice(0,-1),score:e.score-(t.mutation?1:0),undos:e.undos+1,finished:!1,selected:t.id}:e}function F(e){return e===5?"Radiant":e>=3?"Shifting":"Quiet"}function I(e,t,a){return e.pieces.find(r=>r.habitat.some(([s,i])=>s===t&&i===a))}function te(e,t){const a=g(t);if(!e||typeof e!="object")return a;const r=e;if(r.date!==t||!Array.isArray(r.moves))return a;let s=a;for(const n of r.moves){if(!n||typeof n!="object"||!("id"in n))return a;const l=n.id,c=s.pieces.find(h=>h.id===l);if(!c||c.placed)return a;c.rotation=[0,1,2,3].find(h=>T(k(c.cells,h,c.flipped))===c.targetSignature)??c.rotation,f(c)||(c.flipped=!c.flipped,c.rotation=[0,1,2,3].find(h=>T(k(c.cells,h,c.flipped))===c.targetSignature)??c.rotation),s=z({...s,selected:l},l).state}Array.isArray(r.pieces)&&(s.pieces=s.pieces.map(n=>{const l=r.pieces.find(c=>c&&typeof c=="object"&&"id"in c&&c.id===n.id);return l&&Number.isInteger(l.rotation)&&typeof l.flipped=="boolean"?{...n,rotation:Number(l.rotation)%4,flipped:l.flipped}:n})),s.undos=typeof r.undos=="number"?r.undos:0;const i=r.selected&&s.pieces.some(n=>n.id===r.selected&&!n.placed)?r.selected:null;return s.selected=i,Array.isArray(r.cursor)&&r.cursor.length===2&&r.cursor.every(n=>Number.isInteger(n)&&n>=0&&n<m)&&(s.cursor=[r.cursor[0],r.cursor[1]]),s}const b=document.querySelector("#app"),N="shapeshift-set:daily:";let o,d=!1,y="",v="plain";const E=1e3/60;let A=performance.now(),S=0,D=0;function j(e){const t=Math.min(e-A,250);if(A=e,!document.hidden){S+=t;let a=0;for(;S>=E&&a<15;)S-=E,D+=1,a+=1;document.documentElement.dataset.gameTicks=String(D)}requestAnimationFrame(j)}document.documentElement.dataset.frameTarget="60";requestAnimationFrame(j);document.addEventListener("visibilitychange",()=>{A=performance.now(),S=0});const x=e=>M.find(t=>t.id===e);function ae(e){try{const t=localStorage.getItem(`${N}${e}`);return t?te(JSON.parse(t),e):g(e)}catch{return y="Saved progress could not be read. A fresh board is ready.",v="bad",g(e)}}function se(){if(!d)try{localStorage.setItem(`${N}${o.date}`,JSON.stringify(o))}catch{y="Progress could not be saved. This run will not survive reload. Keep this tab open to finish the board.",v="bad"}}function re(e){return new Intl.DateTimeFormat("en",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(`${e}T12:00:00Z`))}function oe(e,t){const a=Math.max(...e.map(([i])=>i))+1,r=Math.max(...e.map(([,i])=>i))+1,s=e.map(([i,n])=>`<rect x="${i*12+1}" y="${n*12+1}" width="10" height="10" rx="2" />`).join("");return`<svg class="piece-shape" viewBox="0 0 ${a*12} ${r*12}" role="img" aria-label="${t} shape">${s}</svg>`}function H(){return`<a class="skip-link" href="#main">Skip to the puzzle</a>
    <header class="site-header">
      <a class="wordmark" href="/" data-link aria-label="Shapeshift Set home">
        <span class="wordmark-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>Shapeshift Set</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="/" data-link>Play</a>
        <a href="/demo" data-link>Demo</a>
        <a href="/#how">How it works</a>
        <a href="/privacy" data-link>Privacy</a>
      </nav>
    </header>`}function B(){return`<footer class="site-footer">
      <p>One shared creature puzzle each day.</p>
      <div class="footer-links">
        <a href="/privacy" data-link>Privacy</a>
        <a href="/terms" data-link>Terms</a>
        <a href="https://sociobot.in" rel="external">Built by Param Factory <span class="sr-only">(external site)</span></a>
      </div>
      <p class="footer-note">Version 1.0 · Original game art. The moon garden image was generated for this product.</p>
    </footer>`}function ie(){const e=new Map;o.pieces.forEach(r=>{const s=r.habitat.reduce(([i,n],[l,c])=>[i+l,n+c],[0,0]);e.set(r.id,[s[0]/r.habitat.length+.5,s[1]/r.habitat.length+.5])});const t=o.pieces.filter(r=>r.mutates).map(r=>{const s=e.get(r.id),i=e.get(r.mutates),n=i[0]-s[0],l=i[1]-s[1],c=Math.hypot(n,l),h=.42,U=s[0]+n/c*h,W=s[1]+l/c*h,_=i[0]-n/c*h,K=i[1]-l/c*h;return`<line class="mutation-link link-${r.id}${r.mutation?" changed":""}" x1="${U}" y1="${W}" x2="${_}" y2="${K}" marker-end="url(#arrow)" />`}).join(""),a=e.get("mote");return`<svg class="board-links" viewBox="0 0 6 6" aria-hidden="true">
    <defs><marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 Z" /></marker></defs>
    ${t}<circle class="seed-mark" cx="${a[0]}" cy="${a[1]}" r="0.13" />
  </svg>`}function ne(e,t){const a=I(o,e,t),r=a?`Row ${t+1}, column ${e+1}. ${a.name} habitat, ${a.placed?"filled":"empty"}.`:`Row ${t+1}, column ${e+1}. Open ground.`,s=["board-cell"];a&&s.push("habitat",`piece-${a.id}`),a?.placed&&s.push("placed"),a?.mutation===!0&&s.push("mutated"),a?.mutation===!1&&s.push("missed"),o.cursor[0]===e&&o.cursor[1]===t&&s.push("cursor");const i=a?.placed?`<span aria-hidden="true">${a.mutation?"✦":"●"}</span>`:"";return`<button class="${s.join(" ")}" data-board-cell data-x="${e}" data-y="${t}" aria-label="${r}" ${a?.placed?'aria-disabled="true"':""}>${i}</button>`}function le(e,t){const a=k(e.cells,e.rotation,e.flipped),r=o.selected===e.id;return`<button class="tray-piece piece-${e.id}${r?" selected":""}" data-select-piece="${e.id}"
      ${e.placed?"disabled":""} aria-pressed="${r}" aria-keyshortcuts="${t+1}">
      <span class="piece-number" aria-hidden="true">${t+1}</span>
      ${oe(a,e.name)}
      <span>${e.name}</span>
      <small>${e.placed?e.mutation?"Changed":"Missed":f(e)?"Fits":"Turn it"}</small>
    </button>`}function ce(){return o.moves.length===0?'<p class="empty-trail">Placed mutations will appear here.</p>':`<ol class="score-trail">${o.moves.map(e=>{const t=x(e.id),a=t.mutates?x(t.mutates).name:"seed tile";return`<li class="${e.mutation?"success":"miss"}"><strong>${t.name}</strong><span>${e.mutation?`Changed ${a}`:`${a} was empty`}</span><b aria-label="${e.mutation?"scored":"did not score"}">${e.mutation?"+1":"0"}</b></li>`}).join("")}</ol>`}function de(){if(!o.finished)return"";const e=F(o.score),t=e==="Radiant"?"Every mutation landed. You found the only perfect order.":e==="Shifting"?"Most mutations landed. Trace each arrow back before another run.":"Some neighbors were still empty. Place each arrow target first.";return`<section class="result-panel tier-${e.toLowerCase()}" aria-labelledby="result-title">
    <p class="result-kicker">${e} set</p>
    <h3 id="result-title">You changed ${o.score} of 5</h3>
    <p>${t}</p>
    <p class="result-detail">${o.undos} ${o.undos===1?"undo":"undos"} · Seed ${o.seed}</p>
    <div class="result-actions">
      <button class="button primary" data-replay>Play this board again</button>
      <button class="button quiet" data-share>Copy result</button>
    </div>
  </section>`}function Y(){const e=Array.from({length:m*m},(a,r)=>ne(r%m,Math.floor(r/m))).join(""),t=o.selected?o.pieces.find(a=>a.id===o.selected):null;return`<section class="game-shell" id="game" aria-labelledby="game-title">
    <div class="game-topline">
      <div>
        <p class="section-label">${d?"Sample board":"Daily board"} · ${re(o.date)}</p>
        <h2 id="game-title">Match the habitats</h2>
      </div>
      <div class="seed"><span>Seed</span><strong>${o.seed}</strong></div>
    </div>
    <p class="game-rule">Place an arrow’s target first. Then the creature changes that neighbor and scores one.</p>
    <div class="game-layout">
      <div class="board-column">
        <div class="board-wrap">
          ${ie()}
          <div class="board" role="group" aria-label="Six by six creature habitat board">${e}</div>
        </div>
        <p class="board-key"><span class="seed-dot" aria-hidden="true"></span>The gold point starts the chain. Each arrow points to a neighbor that must be placed first.</p>
      </div>
      <div class="game-tools">
        <div class="score-box" aria-label="Current score"><strong>${o.score}<span>/5</span></strong><p>mutations</p></div>
        <div class="tool-copy">
          <h3>Choose a creature</h3>
          <p>Match its blocks to one dotted habitat.</p>
        </div>
        <div class="piece-tray">${o.pieces.map(le).join("")}</div>
        <div class="turn-tools" aria-label="Turn the selected creature">
          <button data-rotate="-1" aria-label="Rotate selected creature left" aria-keyshortcuts="Q" ${t?"":"disabled"}>↶ <span>Left</span></button>
          <button data-flip aria-label="Flip selected creature" aria-keyshortcuts="F" ${t?"":"disabled"}>↔ <span>Flip</span></button>
          <button data-rotate="1" aria-label="Rotate selected creature right" aria-keyshortcuts="E" ${t?"":"disabled"}>↷ <span>Right</span></button>
        </div>
        <div class="history-tools">
          <button class="text-button" data-undo ${o.moves.length?"":"disabled"}>Undo last piece</button>
          <button class="text-button" data-reset>${d?"Reset demo":"Reset board"}</button>
        </div>
      </div>
    </div>
    <div class="status-row ${v}" aria-live="polite" aria-atomic="true">${y||"Choose a creature, turn it, then select its habitat."}</div>
    <div class="trail-wrap"><h3>Mutation score</h3>${ce()}</div>
    ${de()}
  </section>`}function ue(){return d?`<aside class="demo-banner" aria-label="Demo mode">
    <strong>Demo — sample board, nothing is saved</strong>
    <div><button data-demo-reset>Reset demo</button><a href="/" data-link>Start for real</a></div>
  </aside>`:""}function pe(){return`${H()}${ue()}<main id="main" tabindex="-1">
    <section class="opening" aria-labelledby="page-title">
      <div class="opening-copy">
        <p class="section-label">One shared 6×6 board each day</p>
        <h1 id="page-title" tabindex="-1">${d?"Place five sample creatures in order":"Place five creatures in the right order"}</h1>
        <p class="hero-summary">For daily puzzle players who want one shared spatial challenge that ends after five creatures.</p>
        ${d?'<p class="action-note">The complete sample board is ready to play.</p>':'<div class="hero-action"><a class="button primary" href="/demo" data-link>Try it with sample data</a><span>It opens a complete sample board.</span></div>'}
        <ul class="plain-facts">
          <li>Free to play.</li>
          <li>Progress stays in this browser.</li>
          <li>A new shared board appears each UTC day.</li>
        </ul>
      </div>
      ${Y()}
    </section>
    <section class="landscape" aria-label="Moon garden illustration">
      <div class="hero-art" aria-hidden="true">
        <picture><source media="(max-width: 700px)" srcset="/assets/moon-garden-720.webp"><img src="/assets/moon-garden-1200.webp" width="1200" height="800" alt="" fetchpriority="high" decoding="async"></picture>
        <div class="art-caption">A moon garden built for five shapes</div>
      </div>
    </section>
    <section class="how" id="how" aria-labelledby="how-title">
      <div class="section-intro"><p class="section-label">Three actions</p><h2 id="how-title">How to play</h2></div>
      <ol class="steps">
        <li><span>1</span><div><h3>Read the arrows</h3><p>An arrow scores only when its target creature is already on the board.</p></div></li>
        <li><span>2</span><div><h3>Turn each creature</h3><p>Rotate or flip its blocks until they match one dotted habitat.</p></div></li>
        <li><span>3</span><div><h3>Place all five</h3><p>Finish the board, inspect each mutation, and compare your score tier.</p></div></li>
      </ol>
    </section>
    <section class="limits" aria-labelledby="limits-title">
      <div><p class="section-label">Scope and privacy</p><h2 id="limits-title">One puzzle, then a clear ending</h2></div>
      <div class="limits-copy"><p>There are no accounts, ads, boosters, or public leaderboards.</p><p>Your daily progress uses local browser storage. Demo actions use memory only.</p><p>The game loads from this site and can reopen offline after the first visit.</p></div>
    </section>
  </main>${B()}${he()}`}function P(e){const t=e==="privacy"?{title:"Privacy without an account",label:"Privacy",body:"<p>Shapeshift Set does not ask for your name, email address, or an account.</p><h2>What stays on your device</h2><p>The game saves daily moves, scores, and undo counts in your browser’s local storage. Demo play stays in memory and is discarded when you leave the demo.</p><h2>What this site receives</h2><p>The host may process standard request logs needed to serve and protect the site. The game sends no analytics events and loads no third-party scripts.</p><h2>Clear your progress</h2><p>Use “Reset board” inside the game, or clear this site’s storage in your browser settings.</p><p>Last updated: September 2, 2026.</p>"}:e==="terms"?{title:"Terms for fair daily play",label:"Terms",body:"<p>Shapeshift Set is a free daily browser game for personal use.</p><h2>Using the game</h2><p>You may play, share your result, and inspect the open source code. Do not disrupt the site or use it to harm other people.</p><h2>Availability</h2><p>The game is provided as available. Daily boards or features may change. Local progress can be lost when browser storage is cleared.</p><h2>Ownership</h2><p>The code uses the MIT License. Original game art remains subject to the notices in the repository.</p><p>Last updated: September 2, 2026.</p>"}:{title:"This page does not exist",label:"404",body:'<p>The address does not match a Shapeshift Set page.</p><a class="button primary" href="/" data-link>Return to today’s puzzle</a>'};return`${H()}<main id="main" class="text-page" tabindex="-1"><p class="section-label">${t.label}</p><h1 tabindex="-1">${t.title}</h1><div class="prose">${t.body}</div></main>${B()}`}function he(){return`<dialog class="reset-dialog" aria-labelledby="reset-title">
    <div><p class="section-label">Reset progress</p><h2 id="reset-title">Start this board again?</h2><p>Your current moves and score will be cleared.</p><div class="dialog-actions"><button class="button quiet" data-cancel-reset>Keep my moves</button><button class="button danger" data-confirm-reset>Reset board</button></div></div>
  </dialog>`}function R(){const e=window.location.pathname.replace(/\/$/,"")||"/";if(d=e==="/demo",y="",v="plain",e==="/"||e==="/demo"){const t=d?X:Q();o=d?g(t):ae(t),document.title=d?"Demo — Shapeshift Set":"Shapeshift Set — place a daily creature puzzle",w(d?"Try a complete Shapeshift Set sample board without saving progress.":"Place five shifting creatures on one shared 6x6 daily board. Finish a spatial puzzle with five placements."),$(d?"/demo":"/"),b.innerHTML=pe()}else e==="/privacy"?(document.title="Privacy — Shapeshift Set",w("Learn what Shapeshift Set stores in your browser and how the game avoids accounts and third-party tracking."),$("/privacy"),b.innerHTML=P("privacy")):e==="/terms"?(document.title="Terms — Shapeshift Set",w("Read the terms for playing and sharing Shapeshift Set."),$("/terms"),b.innerHTML=P("terms")):(document.title="Page not found — Shapeshift Set",w("Return to the current Shapeshift Set daily puzzle."),$("/404"),b.innerHTML=P("404"))}function $(e){document.querySelector('link[rel="canonical"]').href=`https://shapeshift-set.sociobot.in${e}`}function w(e){document.querySelector('meta[name="description"]').content=e}function u(e){const t=document.querySelector(".game-shell");if(!t)return;se();const a=document.createElement("div");a.innerHTML=Y(),t.replaceWith(a.firstElementChild),e&&document.querySelector(e)?.focus()}function p(e,t="plain"){y=e,v=t}function G(e){const t=o.pieces.find(a=>a.id===e);!t||t.placed||(o={...o,selected:e},p(`${t.name} selected. ${f(t)?"Its shape now fits.":"Turn it to match its dotted habitat."}`),u(`[data-select-piece="${e}"]`))}function me(e,t){const a=I(o,e,t);if(o={...o,cursor:[e,t]},!a){p("That tile has no habitat. Choose a dotted shape.","bad"),u(`[data-x="${e}"][data-y="${t}"]`);return}const r=z(o,a.id);if(r.error)p({select:"No creature is selected. Choose one from the tray first.",occupied:"That habitat is filled. Choose an empty dotted habitat.","wrong-habitat":"That creature has a different shape. Choose its matching habitat.",orientation:"The blocks do not match yet. Rotate or flip the creature, then try again."}[r.error],"bad");else{const s=r.state.moves.at(-1),i=x(s.id).name;p(s.mutation?`${i} changed its neighbor. One mutation scored.`:`${i} was placed, but its target was empty. No mutation scored.`,s.mutation?"good":"bad"),o=r.state}u(`[data-x="${e}"][data-y="${t}"]`)}function L(){const e=o.date;o=g(e),document.querySelector(".reset-dialog")?.close(),p(d?"The sample board was reset.":"Today’s board was reset."),u('[data-select-piece="mote"]')}function fe(){const e=o.moves.map(a=>a.mutation?"✦":"·").join(""),t=`Shapeshift Set ${o.date}
${e} ${o.score}/5 · ${F(o.score)}
Seed ${o.seed}`;navigator.clipboard.writeText(t).then(()=>{p("Result copied. It contains the score, tier, and seed.","good"),u("[data-share]")}).catch(()=>{p("The result could not be copied. Allow clipboard access and try again.","bad"),u("[data-share]")})}b.addEventListener("click",e=>{const t=e.target,a=t.closest("a[data-link]");if(a&&a.origin===window.location.origin){e.preventDefault(),history.pushState({},"",a.href),R(),document.querySelector("h1")?.focus({preventScroll:!0}),window.scrollTo({top:0,behavior:"instant"});return}const r=t.closest("[data-select-piece]");if(r)return G(r.dataset.selectPiece);const s=t.closest("[data-board-cell]");if(s)return me(Number(s.dataset.x),Number(s.dataset.y));const i=t.closest("[data-rotate]");if(i){o=C(o,Number(i.dataset.rotate));const n=o.pieces.find(l=>l.id===o.selected);return p(f(n)?`${n.name} now fits its habitat.`:`${n.name} turned. The blocks do not match yet.`,f(n)?"good":"plain"),u(`[data-rotate="${i.dataset.rotate}"]`)}if(t.closest("[data-flip]")){o=O(o);const n=o.pieces.find(l=>l.id===o.selected);return p(f(n)?`${n.name} now fits its habitat.`:`${n.name} flipped. The blocks do not match yet.`,f(n)?"good":"plain"),u("[data-flip]")}if(t.closest("[data-undo]"))return o=ee(o),p("The last piece returned to the tray. Its mutation was removed."),u("[data-undo]");if(t.closest("[data-reset]")){if(d||o.moves.length===0)return L();document.querySelector(".reset-dialog")?.showModal(),document.querySelector("[data-cancel-reset]")?.focus();return}if(t.closest("[data-demo-reset]"))return L();if(t.closest("[data-cancel-reset]")){t.closest("dialog")?.close(),document.querySelector("[data-reset]")?.focus();return}if(t.closest("[data-confirm-reset]")||t.closest("[data-replay]"))return L();t.closest("[data-share]")&&fe()});document.addEventListener("keydown",e=>{if(!document.querySelector(".game-shell"))return;const t=e.key.toLowerCase();if(/^[1-5]$/.test(t)&&!e.ctrlKey&&!e.metaKey&&!e.altKey)e.preventDefault(),G(M[Number(t)-1].id);else if(t==="q"||t==="e"){if(!o.selected)return;e.preventDefault(),o=C(o,t==="q"?-1:1),u(t==="q"?'[data-rotate="-1"]':'[data-rotate="1"]')}else if(t==="f"){if(!o.selected)return;e.preventDefault(),o=O(o),u("[data-flip]")}else if(e.target instanceof HTMLElement&&e.target.matches("[data-board-cell]")&&["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)){e.preventDefault();const[a,r]=o.cursor,s=e.key==="ArrowUp"?[a,Math.max(0,r-1)]:e.key==="ArrowDown"?[a,Math.min(m-1,r+1)]:e.key==="ArrowLeft"?[Math.max(0,a-1),r]:[Math.min(m-1,a+1),r];o={...o,cursor:s},u(`[data-x="${s[0]}"][data-y="${s[1]}"]`)}else e.key==="Escape"&&document.querySelector(".reset-dialog")&&(document.querySelector(".reset-dialog")?.close(),document.querySelector("[data-reset]")?.focus())});window.addEventListener("popstate",()=>{R(),document.querySelector("h1")?.focus({preventScroll:!0})});window.addEventListener("online",()=>{p("You are back online. The current board stayed in place.","good"),u()});window.addEventListener("offline",()=>{p("You are offline. This loaded board still works.","plain"),u()});R();"serviceWorker"in navigator&&navigator.serviceWorker.register("/sw.js").catch(()=>{});
//# sourceMappingURL=index-IUDNXAQ1.js.map
