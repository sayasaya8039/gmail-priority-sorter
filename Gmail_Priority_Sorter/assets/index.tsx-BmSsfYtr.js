import{g as q}from"./storage-CS1t7rav.js";import{c as A}from"./classifier-BcIm6e9n.js";function L(){if(document.getElementById("gps-styles"))return;const e=document.createElement("style");e.id="gps-styles",e.textContent=`
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
    @keyframes gps-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .gps-critical .gps-priority { animation: gps-pulse 2s ease-in-out infinite; }
  `,document.head.appendChild(e)}const m={critical:{label:"緊急",color:"#DC2626",bgColor:"#FEE2E2"},high:{label:"高",color:"#EA580C",bgColor:"#FFEDD5"},medium:{label:"中",color:"#2563EB",bgColor:"#DBEAFE"},low:{label:"低",color:"#6B7280",bgColor:"#F3F4F6"}},T={urgent:{label:"緊急",icon:"🚨",color:"#DC2626"},important:{label:"重要",icon:"⭐",color:"#F59E0B"},meeting:{label:"会議",icon:"📅",color:"#8B5CF6"},action:{label:"要対応",icon:"📋",color:"#3B82F6"},fyi:{label:"参考",icon:"📝",color:"#10B981"},newsletter:{label:"ニュース",icon:"📰",color:"#6366F1"},promotion:{label:"プロモ",icon:"🏷️",color:"#EC4899"},social:{label:"SNS",icon:"💬",color:"#14B8A6"},other:{label:"その他",icon:"📧",color:"#6B7280"}};let l=null,u=!1,p=null;async function b(){console.log("Gmail Priority Sorter: 初期化開始");try{if(L(),l=await q(),!l.enabled){console.log("Gmail Priority Sorter: 無効化されています");return}await B(),await d(),h(),chrome.runtime.onMessage.addListener(R),console.log("Gmail Priority Sorter: 初期化完了")}catch(e){console.error("Gmail Priority Sorter: 初期化エラー",e)}}function B(){return new Promise(e=>{const t=()=>{document.querySelector('[role="main"]')?e():setTimeout(t,500)};t()})}function R(e){switch(e.type){case"SORT_EMAILS":d();break;case"REFRESH":d();break;case"SETTINGS_UPDATED":e.settings&&(l=e.settings,d());break}}function h(){p&&p.disconnect(),p=new MutationObserver(t=>{u||t.some(r=>r.addedNodes.length>0||r.removedNodes.length>0)&&F()});const e=document.querySelector('[role="main"]');e&&p.observe(e,{childList:!0,subtree:!0})}let g=null;function F(){g&&clearTimeout(g),g=window.setTimeout(()=>{d()},300)}async function d(){if(!(u||!l?.enabled)){u=!0;try{const e=v();if(e.length===0)return;const t=$(e),o=A(t,l);w(o,e),l.autoSort&&O(o,e)}catch(e){console.error("Gmail Priority Sorter: 処理エラー",e)}finally{u=!1}}}function v(){const e=["tr.zA","[data-legacy-thread-id]",".zE",".yO"];for(const o of e){const r=document.querySelectorAll(o);if(r.length>0)return Array.from(r)}const t=document.querySelectorAll('[role="main"] table tbody tr');return Array.from(t).filter(o=>o.querySelector("[data-thread-id]")||o.querySelector("[email]")||o.classList.contains("zA"))}function $(e){return e.map((t,o)=>{const r=`email-row-${o}`;t.setAttribute("data-gps-id",r);const n=t.querySelector("[email]")||t.querySelector(".yX.xY span[name]")||t.querySelector(".yW span"),c=n?.getAttribute("email")||n?.getAttribute("name")||n?.textContent?.trim()||"不明",i=(t.querySelector(".bog")||t.querySelector(".y6")||t.querySelector("[data-thread-subject]"))?.textContent?.trim()||"",f=(t.querySelector(".y2")||t.querySelector(".Zt"))?.textContent?.trim()||"",a=t.querySelector(".xW.xY span")||t.querySelector("[title]"),S=a?.getAttribute("title")||a?.textContent?.trim()||"",x=t.classList.contains("zE")||t.querySelector(".zE")!==null||t.style.fontWeight==="bold",E=t.querySelector(".aZo")!==null||t.querySelector('[data-tooltip="添付ファイルあり"]')!==null,C=t.querySelector(".T-KT.T-KT-Jp")!==null||t.querySelector('[data-tooltip*="スター"]')?.getAttribute("aria-label")?.includes("スター付き")===!0;return{elementId:r,sender:c,subject:i,snippet:f,date:S,isUnread:x,hasAttachment:E,isStarred:C}})}function w(e,t){l&&e.forEach(o=>{const r=t.find(s=>s.getAttribute("data-gps-id")===o.elementId);if(!r)return;const n=r.querySelector(".gps-badge");n&&n.remove();const c=r.querySelector(".gps-score");if(c&&c.remove(),l.showBadges){const s=I(o),i=r.querySelector("td:nth-child(3)")||r.querySelector("td");i&&i.insertBefore(s,i.firstChild)}if(l.showScores){const s=k(o),i=r.querySelector(".xW")||r.querySelector("td:last-child");i&&i.appendChild(s)}z(r,o)})}function I(e){const t=document.createElement("span");t.className="gps-badge";const o=T[e.category],r=m[e.priority];return t.innerHTML=`
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
  `,t.title=`${o.label} / ${e.reason}`,t}function k(e){const t=document.createElement("span");t.className="gps-score";const o=m[e.priority];return t.textContent=`${e.urgencyScore}`,t.style.cssText=`
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
  `,t.title=`緊急度スコア: ${e.urgencyScore}/100`,t}function z(e,t){e.classList.remove("gps-critical","gps-high","gps-medium","gps-low"),e.classList.add(`gps-${t.priority}`);const o=m[t.priority];t.priority==="critical"||t.priority==="high"?e.style.borderLeft=`3px solid ${o.color}`:e.style.borderLeft=""}function O(e,t){const o=t[0]?.parentElement;if(!o)return;p?.disconnect(),[...t].sort((n,c)=>{const s=e.find(a=>a.elementId===n.getAttribute("data-gps-id")),i=e.find(a=>a.elementId===c.getAttribute("data-gps-id")),y=s?.urgencyScore??0;return(i?.urgencyScore??0)-y}).forEach(n=>{o.appendChild(n)}),setTimeout(()=>h(),100)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",b):b();
