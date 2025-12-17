import{g as v}from"./storage-CS1t7rav.js";import{c as B}from"./classifier-BcIm6e9n.js";function I(){if(document.getElementById("gps-styles"))return;const e=document.createElement("style");e.id="gps-styles",e.textContent=`
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
  `,document.head.appendChild(e)}const f={critical:{label:"緊急",color:"#DC2626",bgColor:"#FEE2E2"},high:{label:"高",color:"#EA580C",bgColor:"#FFEDD5"},medium:{label:"中",color:"#2563EB",bgColor:"#DBEAFE"},low:{label:"低",color:"#6B7280",bgColor:"#F3F4F6"}},F={urgent:{label:"緊急",icon:"🚨",color:"#DC2626"},important:{label:"重要",icon:"⭐",color:"#F59E0B"},meeting:{label:"会議",icon:"📅",color:"#8B5CF6"},action:{label:"要対応",icon:"📋",color:"#3B82F6"},fyi:{label:"参考",icon:"📝",color:"#10B981"},newsletter:{label:"ニュース",icon:"📰",color:"#6366F1"},promotion:{label:"プロモ",icon:"🏷️",color:"#EC4899"},social:{label:"SNS",icon:"💬",color:"#14B8A6"},other:{label:"その他",icon:"📧",color:"#6B7280"}};let i=null,u=!1,S=!1,m=null,p="",l=null;async function E(){if(!S){S=!0,console.log("Gmail Priority Sorter: 初期化開始");try{if(I(),i=await v(),!i.enabled){console.log("Gmail Priority Sorter: 無効化されています");return}await G(),await c(),P(),$(),chrome.runtime.onMessage.addListener(D),console.log("Gmail Priority Sorter: 初期化完了")}catch(e){console.error("Gmail Priority Sorter: 初期化エラー",e)}}}function G(){return new Promise(e=>{let t=0;const r=20,o=()=>{t++,document.querySelector('[role="main"]')||t>=r?e():setTimeout(o,500)};o()})}function P(){m&&clearInterval(m),m=window.setInterval(()=>{h().some(r=>{const o=r.getAttribute("data-gps-id"),n=r.querySelector(".gps-badge");return o&&!n})&&(console.log("Gmail Priority Sorter: バッジ消失を検出、再適用中..."),R())},3e3)}function R(){h().forEach(t=>{t.removeAttribute("data-gps-processed")}),c()}function $(){p=window.location.hash,window.addEventListener("hashchange",O),document.addEventListener("click",k,!0),x()}function O(){const e=window.location.hash;e!==p&&(console.log("Gmail Priority Sorter: ハッシュ変更検出",p,"->",e),p=e,setTimeout(()=>{y()},500))}function k(e){e.target.closest('.aKz, [role="tab"], .aAy')&&(console.log("Gmail Priority Sorter: タブクリック検出"),setTimeout(()=>{y()},800))}function x(){l&&l.disconnect();const e=document.querySelector('[role="main"]');if(!e){setTimeout(x,1e3);return}l=new MutationObserver(t=>{t.some(o=>o.type==="childList"&&(o.addedNodes.length>5||o.removedNodes.length>5))&&!d&&(console.log("Gmail Priority Sorter: メールリスト変更検出"),z())}),l.observe(e,{childList:!0,subtree:!0})}let g=null,d=!1;function z(){g&&clearTimeout(g),g=window.setTimeout(()=>{y(),g=null},300)}function y(){d||(d=!0,console.log("Gmail Priority Sorter: 強制リフレッシュ実行"),document.querySelectorAll("[data-gps-processed]").forEach(e=>{e.removeAttribute("data-gps-processed"),e.removeAttribute("data-gps-id")}),document.querySelectorAll(".gps-badge, .gps-score").forEach(e=>e.remove()),setTimeout(()=>{d=!1},500),c())}function D(e){switch(e.type){case"SORT_EMAILS":case"REFRESH":c();break;case"SETTINGS_UPDATED":e.settings&&(i=e.settings,c());break}}async function c(){if(!(u||!i?.enabled)){u=!0;try{const e=h();if(e.length===0)return;const t=M(e),r=B(t,i);N(r,e),H(r)}catch(e){console.error("Gmail Priority Sorter: 処理エラー",e)}finally{u=!1}}}function h(){const e=["tr.zA","tr.zE","tr.yO"];for(const t of e){const r=document.querySelectorAll(t);if(r.length>0)return Array.from(r)}return[]}function M(e){return e.map((t,r)=>{const o=`email-row-${r}`;t.setAttribute("data-gps-id",o);const n=t.querySelector("[email]")||t.querySelector(".yX.xY span[name]")||t.querySelector(".yW span"),a=n?.getAttribute("email")||n?.getAttribute("name")||n?.textContent?.trim()||"不明",C=(t.querySelector(".bog")||t.querySelector(".y6"))?.textContent?.trim()||"",A=t.querySelector(".y2")?.textContent?.trim()||"",b=t.querySelector(".xW.xY span"),w=b?.getAttribute("title")||b?.textContent?.trim()||"",L=t.classList.contains("zE"),T=t.querySelector(".aZo")!==null,q=t.querySelector(".T-KT.T-KT-Jp")!==null;return{elementId:o,sender:a,subject:C,snippet:A,date:w,isUnread:L,hasAttachment:T,isStarred:q}})}function N(e,t){i&&e.forEach(r=>{const o=t.find(n=>n.getAttribute("data-gps-id")===r.elementId);if(o&&o.getAttribute("data-gps-processed")!=="true"){if(o.setAttribute("data-gps-processed","true"),i.showBadges&&!o.querySelector(".gps-badge")){const a=j(r),s=o.querySelector(".bog")?.parentElement||o.querySelector(".y6")?.parentElement||o.querySelector("td.xY");s&&s.insertBefore(a,s.firstChild)}if(i.showScores&&!o.querySelector(".gps-score")){const a=_(r),s=o.querySelector(".xW.xY");s&&s.appendChild(a)}Y(o,r)}})}function j(e){const t=document.createElement("span");t.className="gps-badge";const r=F[e.category],o=f[e.priority];return t.innerHTML=`
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
  `,t.title=`${r.label} / ${e.reason}`,t}function _(e){const t=document.createElement("span");t.className="gps-score";const r=f[e.priority];return t.textContent=`${e.urgencyScore}`,t.style.cssText=`
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
  `,t.title=`緊急度スコア: ${e.urgencyScore}/100`,t}function Y(e,t){e.classList.remove("gps-critical","gps-high","gps-medium","gps-low"),e.classList.add(`gps-${t.priority}`);const r=f[t.priority];t.priority==="critical"||t.priority==="high"?e.style.borderLeft=`3px solid ${r.color}`:e.style.borderLeft=""}function H(e){try{chrome.runtime.sendMessage({type:"EMAILS_CLASSIFIED",emails:e.map(t=>({sender:t.sender,subject:t.subject,priority:t.priority,urgencyScore:t.urgencyScore,category:t.category}))})}catch{}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",E):E();
