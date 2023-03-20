// ==UserScript==
// @name         JD助理
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.7
// @author       yvvw
// @description  一键保价、复制购物车链接
// @icon         https://www.jd.com/favicon.ico
// @license      MIT
// @downloadURL  https://ghproxy.com/https://raw.githubusercontent.com/yvvw/tampermonkey-scripts/main/dist/jd_assistant.user.js
// @match        https://pcsitepp-fm.jd.com/
// @match        https://cart.jd.com/*
// ==/UserScript==

main();function main(){const n=document.createElement("button"),i=location.host.split(".")[0];if(i==="pcsitepp-fm")n.innerText="\u4E00\u952E\u4EF7\u4FDD",n.onclick=async()=>{for(;;){const e=Array.from(document.querySelectorAll("[id^=applyBT]")).filter(t=>t.innerText==="\u7533\u8BF7\u4EF7\u4FDD"&&!t.hasAttribute("style"));if(e.length===0)break;for(;;){const t=e.splice(0,5);if(t.length===0)break;t.forEach(o=>o.click()),await new Promise(o=>setTimeout(o,1e3))}}};else if(i==="cart")n.innerText="\u590D\u5236\u94FE\u63A5",n.onclick=async()=>{let e="";for(const t of Array.from(document.getElementsByClassName("item-selected")))e+=`https://item.jd.com/${t.getAttribute("skuid")}.html

`;for(const t of Array.from(document.getElementsByClassName("item-seleted")))t instanceof HTMLElement&&(e+=`https://item.jd.com/${t.dataset.sku}.html

`);e+="\u590D\u5236",await navigator.clipboard.writeText(e),alert("\u590D\u5236\u6210\u529F")};else return;n.setAttribute("style",`
-webkit-appearance: none;
position: fixed;
top: 350px;
right: 20px;
width: 100px;
height: 32px;
line-height: 32px;
color: #fff;
font-family: "Microsoft YaHei";
background-color: #e2231a;
border: none;
`),document.body.appendChild(n)}
