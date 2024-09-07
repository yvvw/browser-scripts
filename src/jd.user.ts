// ==UserScript==
// @name         Better JD
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.0.6
// @description  一键保价、复制购物车链接
// @author       yvvw
// @icon         https://www.jd.com/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/jd.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/jd.user.js
// @match        https://pcsitepp-fm.jd.com/
// @match        https://cart.jd.com/*
// @noframes
// ==/UserScript==

window.onload = function main() {
  const button = document.createElement('button')

  const site = location.host.split('.')[0]
  if ('pcsitepp-fm' === site) {
    button.setHTMLUnsafe('一键价保')
    button.addEventListener('click', async () => {
      while (true) {
        // 排除超过价保周期及正在进行价保
        const buttons = Array.from(
          document.querySelectorAll<HTMLButtonElement>('[id^=applyBT]')
        ).filter((btn) => btn.innerText === '申请价保' && !btn.hasAttribute('style'))
        if (buttons.length === 0) {
          break
        }
        while (true) {
          const buttons5 = buttons.splice(0, 5)
          if (buttons5.length === 0) {
            break
          }
          buttons5.forEach((btn) => btn.click())
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    })
  } else if ('cart' === site) {
    button.setHTMLUnsafe('复制链接')
    button.addEventListener('click', async () => {
      let linkText = ''
      for (const el of Array.from(document.getElementsByClassName('item-selected'))) {
        linkText += `https://item.jd.com/${el.getAttribute('skuid')}.html\n\n`
      }
      for (const el of Array.from(document.getElementsByClassName('item-seleted'))) {
        if (el instanceof HTMLElement) {
          linkText += `https://item.jd.com/${el.dataset.sku}.html\n\n`
        }
      }
      linkText += '复制'
      await navigator.clipboard.writeText(linkText)
      alert('复制成功')
    })
  } else {
    return
  }

  button.setAttribute(
    'style',
    `
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
`
  )
  document.body.appendChild(button)
}
