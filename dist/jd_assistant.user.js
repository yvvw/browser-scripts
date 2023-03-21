// ==UserScript==
// @name         JD助理
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.7
// @description  一键保价、复制购物车链接
// @author       yvvw
// @icon         https://www.jd.com/favicon.ico
// @license      MIT
// @updateURL    https://ghproxy.com/https://raw.githubusercontent.com/yvvw/tampermonkey-scripts/main/dist/jd_assistant.user.js
// @downloadURL  https://ghproxy.com/https://raw.githubusercontent.com/yvvw/tampermonkey-scripts/main/dist/jd_assistant.user.js
// @match        https://pcsitepp-fm.jd.com/
// @match        https://cart.jd.com/*
// @grant        none
// ==/UserScript==

(()=>{var a=(n,l,t)=>new Promise((e,i)=>{var c=o=>{try{r(t.next(o))}catch(s){i(s)}},m=o=>{try{r(t.throw(o))}catch(s){i(s)}},r=o=>o.done?e(o.value):Promise.resolve(o.value).then(c,m);r((t=t.apply(n,l)).next())});window.onload=f;function f(){let n=document.createElement("button"),l=location.host.split(".")[0];if(l==="pcsitepp-fm")n.innerText="\u4E00\u952E\u4EF7\u4FDD",n.onclick=()=>a(this,null,function*(){for(;;){let t=Array.from(document.querySelectorAll("[id^=applyBT]")).filter(e=>e.innerText==="\u7533\u8BF7\u4EF7\u4FDD"&&!e.hasAttribute("style"));if(t.length===0)break;for(;;){let e=t.splice(0,5);if(e.length===0)break;e.forEach(i=>i.click()),yield new Promise(i=>setTimeout(i,1e3))}}});else if(l==="cart")n.innerText="\u590D\u5236\u94FE\u63A5",n.onclick=()=>a(this,null,function*(){let t="";for(let e of Array.from(document.getElementsByClassName("item-selected")))t+=`https://item.jd.com/${e.getAttribute("skuid")}.html

`;for(let e of Array.from(document.getElementsByClassName("item-seleted")))e instanceof HTMLElement&&(t+=`https://item.jd.com/${e.dataset.sku}.html

`);t+="\u590D\u5236",yield navigator.clipboard.writeText(t),alert("\u590D\u5236\u6210\u529F")});else return;n.setAttribute("style",`
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
`),document.body.appendChild(n)}})();
