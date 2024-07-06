// ==UserScript==
// @name         Better pump.fun
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.3
// @description  增加gmgn、bullx跳转，标记dev交易
// @author       yvvw
// @icon         https://www.pump.fun/icon.png
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/pumpfun.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/pumpfun.user.js
// @match        https://www.pump.fun/*
// @match        https://pump.fun/*
// @grant        none
// ==/UserScript==

import { observe, waitingElement } from './util'

const clearChannel = new Set<Function>()

window.onload = function main() {
  let running = false
  let prevToken = ''

  new MutationObserver(() => {
    const token = location.pathname.slice(1)
    if (running || token.length <= 40 || prevToken === token) {
      return
    }
    running = true
    prevToken = token

    if (clearChannel.size > 0) {
      clearChannel.forEach((fn) => fn())
      clearChannel.clear()
    }

    Promise.allSettled([addExternalLinks(), switchTradePanel()]).finally(() => (running = false))
  }).observe(document.body, {
    childList: true,
    subtree: true,
  })
}

async function addExternalLinks() {
  const threadEl = await waitingElement(
    () => document.evaluate('//div[text()="Thread"]', document).iterateNext() as HTMLDivElement
  )

  const address = location.pathname.replace('/', '')

  const divWrapEl = document.createElement('div')
  divWrapEl.className = 'flex gap-2'
  divWrapEl.style.marginLeft = 'auto'
  divWrapEl.style.color = 'rgb(134 239 172/var(--tw-bg-opacity))'

  const gmgnLinkEl = document.createElement('a')
  gmgnLinkEl.id = 'gmgn'
  gmgnLinkEl.href = `https://gmgn.ai/sol/token/${address}`
  gmgnLinkEl.target = '_blank'
  gmgnLinkEl.innerText = 'GMGN'
  divWrapEl.appendChild(gmgnLinkEl)

  const bullXLinkEl = document.createElement('a')
  bullXLinkEl.id = 'bullx'
  bullXLinkEl.href = `https://bullx.io/terminal?chainId=1399811149&address=${address}`
  bullXLinkEl.target = '_blank'
  bullXLinkEl.innerText = 'BullX'
  divWrapEl.appendChild(bullXLinkEl)

  threadEl.parentElement?.appendChild(divWrapEl)
}

async function switchTradePanel() {
  const tradesEl = await waitingElement(
    () => document.evaluate('//div[text()="Trades"]', document).iterateNext() as HTMLDivElement
  )

  const click = tradesEl.click
  tradesEl.removeEventListener('click', click)
  tradesEl.addEventListener('click', function () {
    labelDevInTradePanel()
  })
  click.apply(tradesEl)
}

async function labelDevInTradePanel() {
  const labelEl = await waitingElement(
    () =>
      document
        .evaluate('//label[text()="Filter by following"]', document)
        .iterateNext() as HTMLLabelElement
  )

  const tableEl = labelEl.parentElement?.parentElement
  if (!tableEl) {
    throw new Error('未发现交易面板')
  }

  const devSibEl = await waitingElement(
    () =>
      document.evaluate('//span[text()="created by"]', document).iterateNext() as HTMLSpanElement
  )
  const devEl = devSibEl.nextSibling as HTMLAnchorElement | undefined
  if (!devEl) {
    throw new Error('未发现dev标签')
  }
  const devName = devEl.href.split('/').pop()

  function labelDev(el: HTMLDivElement) {
    const nameEl = el.firstElementChild?.firstElementChild as HTMLAnchorElement | undefined
    if (!nameEl) {
      throw new Error('未发现a标签')
    }
    const operateType = (el.children.item(1) as HTMLDivElement).innerText
    const rowName = nameEl.href.split('/').pop()
    if (rowName === devName) {
      if (operateType === 'buy') {
        el.className += 'text-white bg-green-500'
      } else if (operateType === 'sell') {
        el.className += 'text-white bg-red-500'
      }
    } else {
      el.className = el.className
        .replace('text-white bg-green-500', '')
        .replace('text-white bg-red-500', '')
    }
  }

  // 跳过前两个表头和最后一个翻页组件
  for (let i = 2; i < tableEl.children.length - 1; i++) {
    labelDev(tableEl.children.item(i) as HTMLDivElement)
  }

  const observer = observe(() => {
    // 跳过前两个表头和最后一个翻页组件
    for (let i = 2; i < tableEl.children.length - 1; i++) {
      labelDev(tableEl.children.item(i) as HTMLDivElement)
    }
  }, tableEl)
  clearChannel.add(() => observer.disconnect())
}
