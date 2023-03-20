// ==UserScript==
// @name         Better Bilibili
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.1
// @description  移除不需要组件、网页全屏、最高可用清晰度
// @author       yvvw
// @icon         https://www.bilibili.com/favicon.ico
// @license      MIT
// @updateURL    https://ghproxy.com/https://raw.githubusercontent.com/yvvw/tampermonkey-scripts/main/dist/bilibili_better.user.js
// @downloadURL  https://ghproxy.com/https://raw.githubusercontent.com/yvvw/tampermonkey-scripts/main/dist/bilibili_better.user.js
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/bangumi/play/*
// @match        https://live.bilibili.com/*
// @grant        none
// ==/UserScript==

(()=>{var u=(e,t,l)=>{if(!t.has(e))throw TypeError("Cannot "+l)};var r=(e,t,l)=>(u(e,t,"read from private field"),l?l.call(e):t.get(e)),c=(e,t,l)=>{if(t.has(e))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(e):t.set(e,l)};window.onload=o;async function o(){let e=s.getConfig();e!==null&&(await y(e),m(),d(e),p(e))}async function y(e){if(e.waitSelector)for(;await new Promise(l=>setTimeout(l,100)),document.querySelector(e.waitSelector)===null;);}function m(){let e=document.querySelector("head");if(e===null)return;let t="#my-dear-haruna-vm{display:none !important}",l=document.createElement("style");l.type="text/css",l.appendChild(document.createTextNode(t)),e.appendChild(l)}function d(e){if(e.type==="live"){b();return}if(!e.qualitySelector||!e.activeQualityClassName)return;let t=document.querySelector(e.qualitySelector);if(t===null)return;let l=t.children.length;for(let i=0;i<l;i++){let n=t.children.item(i);if(n===null||n.classList.contains(e.activeQualityClassName))break;f(n,e)||n.click()}}function f(e,t){if(!t.bigVipQualityClassName)return!1;let l=e.children.length;for(let i=0;i<l;i++){let n=e.children.item(i);if(n===null)break;if(n.classList.contains(t.bigVipQualityClassName))return!0}return!1}function b(){let e=window.livePlayer||window.top.livePlayer;if(!e)return;let t=e.getPlayerInfo(),l=t.qualityCandidates;l.length!==0&&l[0].qn!==t.quality&&e.switchQuality(l[0].qn)}function p(e){if(!e.webFullscreenSelector||!e.activeWebFullscreenClassName)return;let t=document.querySelector(e.webFullscreenSelector);console.log(t),t!==null&&(t.classList.contains(e.activeWebFullscreenClassName)||t.click())}var a,s=class{static getConfig(){let t=Object.keys(r(this,a)),l=document.location.href;for(let i of t)if(l.match(i)!=null)return r(this,a)[i];return null}};a=new WeakMap,c(s,a,{live:{type:"live",waitSelector:"video"},video:{type:"video",waitSelector:".bpx-player-ctrl-web",qualitySelector:"ul.bpx-player-ctrl-quality-menu",activeQualityClassName:"bpx-state-active",webFullscreenSelector:".bpx-player-ctrl-web",activeWebFullscreenClassName:"bpx-state-entered"},bangumi:{type:"bangumi",waitSelector:".squirtle-video-pagefullscreen",bigVipQualityClassName:"squirtle-bigvip",qualitySelector:"ul.squirtle-quality-select-list",activeQualityClassName:"active",webFullscreenSelector:".squirtle-video-pagefullscreen",activeWebFullscreenClassName:"active"}});})();
