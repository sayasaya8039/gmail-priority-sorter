import{g as S}from"./storage-CS1t7rav.js";import{c as E}from"./classifier-BcIm6e9n.js";function C(){if(document.getElementById("gps-styles"))return;const e=document.createElement("style");e.id="gps-styles",e.textContent=`
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
  `,document.head.appendChild(e)}const p={critical:{label:"緊急",color:"#DC2626",bgColor:"#FEE2E2"},high:{label:"高",color:"#EA580C",bgColor:"#FFEDD5"},medium:{label:"中",color:"#2563EB",bgColor:"#DBEAFE"},low:{label:"低",color:"#6B7280",bgColor:"#F3F4F6"}},A={urgent:{label:"緊急",icon:"🚨",color:"#DC2626"},important:{label:"重要",icon:"⭐",color:"#F59E0B"},meeting:{label:"会議",icon:"📅",color:"#8B5CF6"},action:{label:"要対応",icon:"📋",color:"#3B82F6"},fyi:{label:"参考",icon:"📝",color:"#10B981"},newsletter:{label:"ニュース",icon:"📰",color:"#6366F1"},promotion:{label:"プロモ",icon:"🏷️",color:"#EC4899"},social:{label:"SNS",icon:"💬",color:"#14B8A6"},other:{label:"その他",icon:"📧",color:"#6B7280"}};let n=null,c=!1,d=!1;async function m(){if(!d){d=!0,console.log("Gmail Priority Sorter: 初期化開始");try{if(C(),n=await S(),!n.enabled){console.log("Gmail Priority Sorter: 無効化されています");return}await L(),await a(),chrome.runtime.onMessage.addListener(q),console.log("Gmail Priority Sorter: 初期化完了")}catch(e){console.error("Gmail Priority Sorter: 初期化エラー",e)}}}function L(){return new Promise(e=>{let t=0;const o=20,r=()=>{t++,document.querySelector('[role="main"]')||t>=o?e():setTimeout(r,500)};r()})}function q(e){switch(e.type){case"SORT_EMAILS":case"REFRESH":a();break;case"SETTINGS_UPDATED":e.settings&&(n=e.settings,a());break}}async function a(){if(!(c||!n?.enabled)){c=!0;try{const e=w();if(e.length===0)return;const t=B(e),o=E(t,n);F(o,e)}catch(e){console.error("Gmail Priority Sorter: 処理エラー",e)}finally{c=!1}}}function w(){const e=["tr.zA","tr.zE","tr.yO"];for(const t of e){const o=document.querySelectorAll(t);if(o.length>0)return Array.from(o)}return[]}function B(e){return e.map((t,o)=>{const r=`email-row-${o}`;t.setAttribute("data-gps-id",r);const i=t.querySelector("[email]")||t.querySelector(".yX.xY span[name]")||t.querySelector(".yW span"),l=i?.getAttribute("email")||i?.getAttribute("name")||i?.textContent?.trim()||"不明",u=(t.querySelector(".bog")||t.querySelector(".y6"))?.textContent?.trim()||"",y=t.querySelector(".y2")?.textContent?.trim()||"",g=t.querySelector(".xW.xY span"),f=g?.getAttribute("title")||g?.textContent?.trim()||"",b=t.classList.contains("zE"),x=t.querySelector(".aZo")!==null,h=t.querySelector(".T-KT.T-KT-Jp")!==null;return{elementId:r,sender:l,subject:u,snippet:y,date:f,isUnread:b,hasAttachment:x,isStarred:h}})}function F(e,t){n&&e.forEach(o=>{const r=t.find(i=>i.getAttribute("data-gps-id")===o.elementId);if(r&&r.getAttribute("data-gps-processed")!=="true"){if(r.setAttribute("data-gps-processed","true"),n.showBadges&&!r.querySelector(".gps-badge")){const l=T(o),s=r.querySelector("td.xY")||r.querySelector("td:nth-child(4)");s&&s.insertBefore(l,s.firstChild)}if(n.showScores&&!r.querySelector(".gps-score")){const l=$(o),s=r.querySelector(".xW.xY");s&&s.appendChild(l)}I(r,o)}})}function T(e){const t=document.createElement("span");t.className="gps-badge";const o=A[e.category],r=p[e.priority];return t.innerHTML=`
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
  `,t.title=`${o.label} / ${e.reason}`,t}function $(e){const t=document.createElement("span");t.className="gps-score";const o=p[e.priority];return t.textContent=`${e.urgencyScore}`,t.style.cssText=`
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
  `,t.title=`緊急度スコア: ${e.urgencyScore}/100`,t}function I(e,t){e.classList.remove("gps-critical","gps-high","gps-medium","gps-low"),e.classList.add(`gps-${t.priority}`);const o=p[t.priority];t.priority==="critical"||t.priority==="high"?e.style.borderLeft=`3px solid ${o.color}`:e.style.borderLeft=""}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",m):m();
