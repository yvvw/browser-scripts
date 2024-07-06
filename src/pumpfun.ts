// ==UserScript==
// @name         Better pump.fun
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.6
// @description  增加gmgn、bullx跳转，标记dev交易，快速交易
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

    Promise.allSettled([
      addQuickButton().then(addExternalLinks),
      switchTradePanel(),
      autoTrade(),
    ]).finally(() => (running = false))
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
  divWrapEl.style.color = 'rgb(134 239 172/var(--tw-bg-opacity))'

  divWrapEl.appendChild(createExternalLink('GMGN', `https://gmgn.ai/sol/token/${address}`))
  divWrapEl.appendChild(
    createExternalLink('BullX', `https://bullx.io/terminal?chainId=1399811149&address=${address}`)
  )
  threadEl.parentElement?.appendChild(divWrapEl)
}

function createExternalLink(text: string, href: string) {
  const el = document.createElement('a')
  el.href = href
  el.target = '_blank'
  el.innerText = text
  return el
}

async function addQuickButton() {
  const threadEl = await waitingElement(
    () => document.evaluate('//div[text()="Thread"]', document).iterateNext() as HTMLDivElement
  )
  const divWrapEl = document.createElement('div')
  divWrapEl.className = 'flex'
  divWrapEl.style.marginLeft = 'auto'
  divWrapEl.style.marginRight = '20px'
  divWrapEl.style.color = 'rgb(134 239 172/var(--tw-bg-opacity))'
  divWrapEl.appendChild(createQuickButton('0.5', () => quickBuy('0.5')))
  divWrapEl.appendChild(createQuickButton('1', () => quickBuy('1')))
  divWrapEl.appendChild(createQuickButton('1.5', () => quickBuy('1.5')))
  divWrapEl.appendChild(createQuickButton('2', () => quickBuy('2')))
  divWrapEl.appendChild(createQuickButton('2.5', () => quickBuy('2.5')))
  divWrapEl.appendChild(createQuickButton('3', () => quickBuy('3')))
  threadEl.parentElement?.appendChild(divWrapEl)
}

function createQuickButton(text: string, onClick: EventListener) {
  const el = document.createElement('button')
  el.innerText = text
  el.className = 'px-3 hover:bg-gray-800'
  el.addEventListener('click', onClick)
  return el
}

async function quickBuy(text: string) {
  const inputEl = await waitingElement(() => document.getElementById('amount') as HTMLInputElement)
  setNativeValue(inputEl, text)

  const tradeEl = await waitingElement(
    () =>
      document
        .evaluate('//button[text()="place trade"]', document)
        .iterateNext() as HTMLButtonElement
  )
  tradeEl.click()
}

function setNativeValue(el: Element, value: string) {
  const valueDescriptor = Object.getOwnPropertyDescriptor(el, 'value')
  const prototypeValueDescriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(el),
    'value'
  )

  if (valueDescriptor && prototypeValueDescriptor) {
    const valueSetter = valueDescriptor.set!
    const prototypeValueSetter = prototypeValueDescriptor.set!

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(el, value)
    } else {
      valueSetter.call(el, value)
    }

    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

async function autoTrade() {
  const buttonEl = await waitingElement(
    () =>
      document
        .evaluate('//button[text()="place trade"]', document)
        .iterateNext() as HTMLButtonElement
  )

  const click = buttonEl.click
  buttonEl.removeEventListener('click', click)
  buttonEl.addEventListener('click', async function () {
    const cancelEl = await waitingElement(
      () =>
        document.evaluate('//div[text()="[cancel]"]', document).iterateNext() as HTMLButtonElement
    )
    ;(cancelEl.previousElementSibling as HTMLButtonElement).click()
    cancelEl.click()
  })
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
