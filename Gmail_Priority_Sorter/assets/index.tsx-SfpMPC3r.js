import{g as C}from"./storage-CS1t7rav.js";import{c as A}from"./classifier-BcIm6e9n.js";function w(){if(document.getElementById("gps-styles"))return;const e=document.createElement("style");e.id="gps-styles",e.textContent=`
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
  `,document.head.appendChild(e)}const g={critical:{label:"緊急",color:"#DC2626",bgColor:"#FEE2E2"},high:{label:"高",color:"#EA580C",bgColor:"#FFEDD5"},medium:{label:"中",color:"#2563EB",bgColor:"#DBEAFE"},low:{label:"低",color:"#6B7280",bgColor:"#F3F4F6"}},B={urgent:{label:"緊急",icon:"🚨",color:"#DC2626"},important:{label:"重要",icon:"⭐",color:"#F59E0B"},meeting:{label:"会議",icon:"📅",color:"#8B5CF6"},action:{label:"要対応",icon:"📋",color:"#3B82F6"},fyi:{label:"参考",icon:"📝",color:"#10B981"},newsletter:{label:"ニュース",icon:"📰",color:"#6366F1"},promotion:{label:"プロモ",icon:"🏷️",color:"#EC4899"},social:{label:"SNS",icon:"💬",color:"#14B8A6"},other:{label:"その他",icon:"📧",color:"#6B7280"}};let i=null,l=!1,m=!1,p=null;async function y(){if(!m){m=!0,console.log("Gmail Priority Sorter: 初期化開始");try{if(w(),i=await C(),!i.enabled){console.log("Gmail Priority Sorter: 無効化されています");return}await I(),await a(),L(),chrome.runtime.onMessage.addListener(F),console.log("Gmail Priority Sorter: 初期化完了")}catch(e){console.error("Gmail Priority Sorter: 初期化エラー",e)}}}function I(){return new Promise(e=>{let t=0;const r=20,o=()=>{t++,document.querySelector('[role="main"]')||t>=r?e():setTimeout(o,500)};o()})}function L(){p&&clearInterval(p),p=window.setInterval(()=>{d().some(r=>{const o=r.getAttribute("data-gps-id"),n=r.querySelector(".gps-badge");return o&&!n})&&(console.log("Gmail Priority Sorter: バッジ消失を検出、再適用中..."),q())},3e3)}function q(){d().forEach(t=>{t.removeAttribute("data-gps-processed")}),a()}function F(e){switch(e.type){case"SORT_EMAILS":case"REFRESH":a();break;case"SETTINGS_UPDATED":e.settings&&(i=e.settings,a());break}}async function a(){if(!(l||!i?.enabled)){l=!0;try{const e=d();if(e.length===0)return;const t=T(e),r=A(t,i);$(r,e),z(r)}catch(e){console.error("Gmail Priority Sorter: 処理エラー",e)}finally{l=!1}}}function d(){const e=["tr.zA","tr.zE","tr.yO"];for(const t of e){const r=document.querySelectorAll(t);if(r.length>0)return Array.from(r)}return[]}function T(e){return e.map((t,r)=>{const o=`email-row-${r}`;t.setAttribute("data-gps-id",o);const n=t.querySelector("[email]")||t.querySelector(".yX.xY span[name]")||t.querySelector(".yW span"),c=n?.getAttribute("email")||n?.getAttribute("name")||n?.textContent?.trim()||"不明",f=(t.querySelector(".bog")||t.querySelector(".y6"))?.textContent?.trim()||"",b=t.querySelector(".y2")?.textContent?.trim()||"",u=t.querySelector(".xW.xY span"),h=u?.getAttribute("title")||u?.textContent?.trim()||"",S=t.classList.contains("zE"),x=t.querySelector(".aZo")!==null,E=t.querySelector(".T-KT.T-KT-Jp")!==null;return{elementId:o,sender:c,subject:f,snippet:b,date:h,isUnread:S,hasAttachment:x,isStarred:E}})}function $(e,t){i&&e.forEach(r=>{const o=t.find(n=>n.getAttribute("data-gps-id")===r.elementId);if(o&&o.getAttribute("data-gps-processed")!=="true"){if(o.setAttribute("data-gps-processed","true"),i.showBadges&&!o.querySelector(".gps-badge")){const c=G(r),s=o.querySelector(".bog")?.parentElement||o.querySelector(".y6")?.parentElement||o.querySelector("td.xY");s&&s.insertBefore(c,s.firstChild)}if(i.showScores&&!o.querySelector(".gps-score")){const c=P(r),s=o.querySelector(".xW.xY");s&&s.appendChild(c)}R(o,r)}})}function G(e){const t=document.createElement("span");t.className="gps-badge";const r=B[e.category],o=g[e.priority];return t.innerHTML=`
    <span class="gps-category" style="color: ${r.color}">
      ${r.icon}
    </span>
    <span class="gps-priority" style="background: ${o.bgColor}; color: ${o.color}">
      ${o.label}
    </span>
  `,t.style.cssText=`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-right: 8px;
    font-size: 11px;
    vertical-align: middle;
  `,t.title=`${r.label} / ${e.reason}`,t}function P(e){const t=document.createElement("span");t.className="gps-score";const r=g[e.priority];return t.textContent=`${e.urgencyScore}`,t.style.cssText=`
    display: inline-block;
    min-width: 24px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    font-size: 10px;
    font-weight: bold;
    color: white;
    background: ${r.color};
    border-radius: 9px;
    margin-left: 8px;
  `,t.title=`緊急度スコア: ${e.urgencyScore}/100`,t}function R(e,t){e.classList.remove("gps-critical","gps-high","gps-medium","gps-low"),e.classList.add(`gps-${t.priority}`);const r=g[t.priority];t.priority==="critical"||t.priority==="high"?e.style.borderLeft=`3px solid ${r.color}`:e.style.borderLeft=""}function z(e){try{chrome.runtime.sendMessage({type:"EMAILS_CLASSIFIED",emails:e.map(t=>({sender:t.sender,subject:t.subject,priority:t.priority,urgencyScore:t.urgencyScore,category:t.category}))})}catch{}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",y):y();
