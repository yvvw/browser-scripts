// ==UserScript==
// @name         Better DEX Screener
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.0.12
// @description  展开关注列表、添加外部跳转、关闭广告
// @author       yvvw
// @icon         https://dexscreener.com/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/dexscreener.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/dexscreener.user.js
// @match        https://dexscreener.com/*
// @grant        none
// ==/UserScript==

import { HTMLUtils } from './util'

window.onload = function main() {
  HTMLUtils.observe(
    () => {
      hideAd()
      expandWatchList().catch(console.error)
      addExternalLink().catch(console.error)
    },
    document.body,
    1000
  )
}

async function expandWatchList() {
  const el = await HTMLUtils.waitingElement(() =>
    document.querySelector<HTMLButtonElement>('button[title="Expand watchlist"]')
  )
  el.click()
}

function hideAd() {
  const res = document.evaluate('//button[text()="Hide ad"]', document)
  while (true) {
    const btn = res.iterateNext() as HTMLButtonElement
    if (btn === null) {
      break
    }
    btn.click()
  }
}

async function addExternalLink() {
  const parts = document.location.pathname.split('/')
  if (parts.length !== 3) {
    throw new Error('未发现有效格式')
  }

  const chain = parts[1]
  if (!['ethereum', 'base', 'solana'].includes(chain)) {
    return
  }

  if (document.querySelector('a[data-external]') !== null) {
    return
  }

  const locateEl = await HTMLUtils.waitingElement(
    () => document.evaluate('//span[text()="Pair"]', document).iterateNext() as HTMLSpanElement
  )
  const wrapEl = locateEl.parentElement!.parentElement!.parentElement as HTMLDivElement

  const links = getExternalLinks(wrapEl, chain)

  if (links === null) {
    return
  }

  const containerEl = document.createElement('div')
  containerEl.style.setProperty('display', 'flex')
  containerEl.style.setProperty('gap', '10px')
  containerEl.style.setProperty('line-height', '36px')
  containerEl.style.setProperty('border-color', 'var(--chakra-colors-blue-900)')
  containerEl.style.setProperty('border-bottom-width', '1px')
  containerEl.style.setProperty('font-size', 'var(--chakra-fontSizes-sm)')
  containerEl.style.setProperty('color', 'var(--chakra-colors-green-300)')
  if (links.gmgn) {
    const gmgnEl = createExternalLinkEl('GMGN', links.gmgn)
    containerEl.appendChild(gmgnEl)
  }
  if (links.bullx) {
    const bullxEl = createExternalLinkEl('BullX', links.bullx)
    containerEl.appendChild(bullxEl)
  }
  wrapEl.insertBefore(containerEl, wrapEl.firstChild)
}

function createExternalLinkEl(text: string, href: string) {
  const el = document.createElement('a')
  el.setAttribute('href', href)
  el.setAttribute('target', '_blank')
  el.setAttribute('rel', 'noopener noreferrer nofollow')
  el.setHTMLUnsafe(text)
  el.dataset['external'] = text
  el.classList.add('chakra-link', 'chakra-button')
  return el
}

function getExternalLinks(el: HTMLDivElement, chain: string) {
  const aEls = el.querySelectorAll('a[title="Open in block explorer"]')
  if (aEls.length !== 3) {
    throw new Error('未发现token地址')
  }
  const aEl = aEls.item(1) as HTMLAnchorElement
  const address = aEl.href.split('/').pop()!

  return {
    gmgn: getGmGnLink(chain, address),
    bullx: getBullxLink(chain, address),
  }
}

function getGmGnLink(chain: string, token: string) {
  let _chain: string
  if (chain === 'ethereum') {
    _chain = 'eth'
  } else if (chain === 'base') {
    _chain = 'base'
  } else if (chain === 'solana') {
    _chain = 'sol'
  } else {
    console.warn(`${chain}暂不支持`)
    return null
  }
  return `https://gmgn.ai/${_chain}/token/${token}`
}

function getBullxLink(chain: string, token: string) {
  let chainId: number
  if (chain === 'ethereum') {
    chainId = 1
  } else if (chain === 'base') {
    chainId = 8453
  } else if (chain === 'solana') {
    chainId = 1399811149
  } else {
    console.warn(`${chain}暂不支持`)
    return null
  }
  return `https://bullx.io/terminal?chainId=${chainId}&address=${token}`
}
