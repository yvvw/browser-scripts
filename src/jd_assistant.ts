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

main()

function main() {
  const button = document.createElement('button')

  const site = location.host.split('.')[0]
  if ('pcsitepp-fm' === site) {
    button.innerText = '一键价保'
    button.onclick = async () => {
      while (true) {
        // 排除超过价保周期及正在进行价保
        const buttons = Array.from(
          document.querySelectorAll<HTMLButtonElement>('[id^=applyBT]'),
        ).filter(
          (btn) => btn.innerText === '申请价保' && !btn.hasAttribute('style'),
        )
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
    }
  } else if ('cart' === site) {
    button.innerText = '复制链接'
    button.onclick = async () => {
      let linkText = ''
      for (const el of Array.from(
        document.getElementsByClassName('item-selected'),
      )) {
        linkText += `https://item.jd.com/${el.getAttribute('skuid')}.html\n\n`
      }
      for (const el of Array.from(
        document.getElementsByClassName('item-seleted'),
      )) {
        if (el instanceof HTMLElement) {
          linkText += `https://item.jd.com/${el.dataset.sku}.html\n\n`
        }
      }
      linkText += '复制'
      await navigator.clipboard.writeText(linkText)
      alert('复制成功')
    }
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
`,
  )
  document.body.appendChild(button)
}
