import{g as q}from"./storage-CS1t7rav.js";import{c as v}from"./classifier-BcIm6e9n.js";function B(){if(document.getElementById("gps-styles"))return;const e=document.createElement("style");e.id="gps-styles",e.textContent=`
    .gps-badge {
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      margin-right: 8px !important;
      font-size: 11px !important;
      vertical-align: middle !important;
      white-space: nowrap !important;
    }
    .gps-category { font-size: 12px !important; }
    .gps-priority {
      padding: 2px 6px !important;
      border-radius: 10px !important;
      font-size: 10px !important;
      font-weight: 600 !important;
    }
    .gps-score {
      display: inline-block !important;
      min-width: 24px !important;
      height: 18px !important;
      line-height: 18px !important;
      text-align: center !important;
      font-size: 10px !important;
      font-weight: bold !important;
      color: white !important;
      border-radius: 9px !important;
      margin-left: 8px !important;
    }
    .gps-critical { background-color: rgba(220, 38, 38, 0.05) !important; }
    .gps-high { background-color: rgba(234, 88, 12, 0.05) !important; }
    .gps-low { opacity: 0.85 !important; }
  `,document.head.appendChild(e)}const m={critical:{label:"緊急",color:"#DC2626",bgColor:"#FEE2E2"},high:{label:"高",color:"#EA580C",bgColor:"#FFEDD5"},medium:{label:"中",color:"#2563EB",bgColor:"#DBEAFE"},low:{label:"低",color:"#6B7280",bgColor:"#F3F4F6"}},I={urgent:{label:"緊急",icon:"🚨",color:"#DC2626"},important:{label:"重要",icon:"⭐",color:"#F59E0B"},meeting:{label:"会議",icon:"📅",color:"#8B5CF6"},action:{label:"要対応",icon:"📋",color:"#3B82F6"},fyi:{label:"参考",icon:"📝",color:"#10B981"},newsletter:{label:"ニュース",icon:"📰",color:"#6366F1"},promotion:{label:"プロモ",icon:"🏷️",color:"#EC4899"},social:{label:"SNS",icon:"💬",color:"#14B8A6"},other:{label:"その他",icon:"📧",color:"#6B7280"}};let i=null,d=!1,b=!1,u=null,p="",l=null;async function S(){if(!b){b=!0,console.log("Gmail Priority Sorter: 初期化開始");try{if(B(),i=await q(),!i.enabled){console.log("Gmail Priority Sorter: 無効化されています");return}await F(),await c(),G(),R(),chrome.runtime.onMessage.addListener(z),console.log("Gmail Priority Sorter: 初期化完了")}catch(e){console.error("Gmail Priority Sorter: 初期化エラー",e)}}}function F(){return new Promise(e=>{let t=0;const o=20,r=()=>{t++,document.querySelector('[role="main"]')||t>=o?e():setTimeout(r,500)};r()})}function G(){u&&clearInterval(u),u=window.setInterval(()=>{f().some(o=>{const r=o.getAttribute("data-gps-id"),n=o.querySelector(".gps-badge");return r&&!n})&&(console.log("Gmail Priority Sorter: バッジ消失を検出、再適用中..."),P())},3e3)}function P(){f().forEach(t=>{t.removeAttribute("data-gps-processed")}),c()}function R(){p=window.location.hash,window.addEventListener("hashchange",$),document.addEventListener("click",O,!0),E()}function $(){const e=window.location.hash;e!==p&&(console.log("Gmail Priority Sorter: ハッシュ変更検出",p,"->",e),p=e,setTimeout(()=>{y()},500))}function O(e){e.target.closest('.aKz, [role="tab"], .aAy')&&(console.log("Gmail Priority Sorter: タブクリック検出"),setTimeout(()=>{y()},800))}function E(){l&&l.disconnect();const e=document.querySelector('[role="main"]');if(!e){setTimeout(E,1e3);return}l=new MutationObserver(t=>{t.some(r=>r.type==="childList"&&(r.addedNodes.length>5||r.removedNodes.length>5))&&(console.log("Gmail Priority Sorter: メールリスト変更検出"),k())}),l.observe(e,{childList:!0,subtree:!0})}let g=null;function k(){g&&clearTimeout(g),g=window.setTimeout(()=>{y(),g=null},300)}function y(){console.log("Gmail Priority Sorter: 強制リフレッシュ実行"),document.querySelectorAll("[data-gps-processed]").forEach(e=>{e.removeAttribute("data-gps-processed"),e.removeAttribute("data-gps-id")}),document.querySelectorAll(".gps-badge, .gps-score").forEach(e=>e.remove()),c()}function z(e){switch(e.type){case"SORT_EMAILS":case"REFRESH":c();break;case"SETTINGS_UPDATED":e.settings&&(i=e.settings,c());break}}async function c(){if(!(d||!i?.enabled)){d=!0;try{const e=f();if(e.length===0)return;const t=D(e),o=v(t,i);M(o,e),Y(o)}catch(e){console.error("Gmail Priority Sorter: 処理エラー",e)}finally{d=!1}}}function f(){const e=["tr.zA","tr.zE","tr.yO"];for(const t of e){const o=document.querySelectorAll(t);if(o.length>0)return Array.from(o)}return[]}function D(e){return e.map((t,o)=>{const r=`email-row-${o}`;t.setAttribute("data-gps-id",r);const n=t.querySelector("[email]")||t.querySelector(".yX.xY span[name]")||t.querySelector(".yW span"),a=n?.getAttribute("email")||n?.getAttribute("name")||n?.textContent?.trim()||"不明",x=(t.querySelector(".bog")||t.querySelector(".y6"))?.textContent?.trim()||"",C=t.querySelector(".y2")?.textContent?.trim()||"",h=t.querySelector(".xW.xY span"),A=h?.getAttribute("title")||h?.textContent?.trim()||"",w=t.classList.contains("zE"),L=t.querySelector(".aZo")!==null,T=t.querySelector(".T-KT.T-KT-Jp")!==null;return{elementId:r,sender:a,subject:x,snippet:C,date:A,isUnread:w,hasAttachment:L,isStarred:T}})}function M(e,t){i&&e.forEach(o=>{const r=t.find(n=>n.getAttribute("data-gps-id")===o.elementId);if(r&&r.getAttribute("data-gps-processed")!=="true"){if(r.setAttribute("data-gps-processed","true"),i.showBadges&&!r.querySelector(".gps-badge")){const a=N(o),s=r.querySelector(".bog")?.parentElement||r.querySelector(".y6")?.parentElement||r.querySelector("td.xY");s&&s.insertBefore(a,s.firstChild)}if(i.showScores&&!r.querySelector(".gps-score")){const a=j(o),s=r.querySelector(".xW.xY");s&&s.appendChild(a)}_(r,o)}})}function N(e){const t=document.createElement("span");t.className="gps-badge";const o=I[e.category],r=m[e.priority];return t.innerHTML=`
    <span class="gps-category" style="color: ${o.color}">
      ${o.icon}
    </span>
    <span class="gps-priority" style="background: ${r.bgColor}; color: ${r.color}">
      ${r.label}
    </span>
  `,t.style.cssText=`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-right: 8px;
    font-size: 11px;
    vertical-align: middle;
  `,t.title=`${o.label} / ${e.reason}`,t}function j(e){const t=document.createElement("span");t.className="gps-score";const o=m[e.priority];return t.textContent=`${e.urgencyScore}`,t.style.cssText=`
    display: inline-block;
    min-width: 24px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    font-size: 10px;
    font-weight: bold;
    color: white;
    background: ${o.color};
    border-radius: 9px;
    margin-left: 8px;
  `,t.title=`緊急度スコア: ${e.urgencyScore}/100`,t}function _(e,t){e.classList.remove("gps-critical","gps-high","gps-medium","gps-low"),e.classList.add(`gps-${t.priority}`);const o=m[t.priority];t.priority==="critical"||t.priority==="high"?e.style.borderLeft=`3px solid ${o.color}`:e.style.borderLeft=""}function Y(e){try{chrome.runtime.sendMessage({type:"EMAILS_CLASSIFIED",emails:e.map(t=>({sender:t.sender,subject:t.subject,priority:t.priority,urgencyScore:t.urgencyScore,category:t.category}))})}catch{}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",S):S();
