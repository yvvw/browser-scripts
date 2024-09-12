// ==UserScript==
// @name         Better DEX Screener
// @namespace    https://github.com/yvvw/browser-scripts
// @homepageURL  https://github.com/yvvw/browser-scripts/blob/main/src/dexscreener.user.ts
// @version      0.0.19
// @description  展开关注列表、添加外部跳转、关闭广告
// @author       yvvw
// @icon         https://dexscreener.com/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/dexscreener.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/dexscreener.user.js
// @match        https://dexscreener.com/*
// @noframes
// ==/UserScript==

import { HTMLUtils, Logger } from './util'

const logger = Logger.new('Better DEX Screener')

function main() {
  HTMLUtils.observe(
    document.body,
    async () => {
      if (!document.getElementById('tv-chart-container')) return
      expandWatchList()
      await addExternalLink().catch(logger.error.bind(logger))
      closeAd()
    },
    { waiting: true, throttle: 500 }
  )
}

function closeAd() {
  const btnEls = document.querySelectorAll<HTMLButtonElement>('button[aria-label="Hide"]')
  for (const btnEl of btnEls) btnEl.click()

  const adBtnEls = HTMLUtils.getElementsByXPath<HTMLButtonElement>('//button[text()="Hide ad"]')
  for (const btnEl of adBtnEls) btnEl.click()
}

function expandWatchList() {
  const el = document.querySelector<HTMLButtonElement>('button[title="Expand watchlist"]')
  if (el === null) return
  el.click()
}

async function addExternalLink() {
  // already added
  if (document.querySelector('a[data-external]') !== null) {
    return
  }

  const chain = getChainFromPath()
  const aEl = await HTMLUtils.query(() =>
    HTMLUtils.getFirstElementByXPath<HTMLSpanElement>('//span[text()="Pair"]')
  )
  const bEl = aEl.parentElement!.parentElement!.parentElement as HTMLDivElement
  const links = getExternalLinks(bEl, chain)
  if (links === null) return

  const containerEl = createExternalContainerEl()
  if (links.gmgn) {
    containerEl.appendChild(createExternalLinkEl('GMGN', links.gmgn))
  }
  if (links.bullx) {
    containerEl.appendChild(createExternalLinkEl('BullX', links.bullx))
  }
  bEl.insertBefore(containerEl, bEl.firstChild)

  await HTMLUtils.query(() => document.querySelector('a[data-external]'))
}

function createExternalContainerEl() {
  const el = document.createElement('div')
  el.style.setProperty('display', 'flex')
  el.style.setProperty('gap', '10px')
  el.style.setProperty('line-height', '36px')
  el.style.setProperty('border-color', 'var(--chakra-colors-blue-900)')
  el.style.setProperty('border-bottom-width', '1px')
  el.style.setProperty('font-size', 'var(--chakra-fontSizes-sm)')
  el.style.setProperty('color', 'var(--chakra-colors-green-300)')
  return el
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

const SUPPORT_CHAINS = ['ethereum', 'base', 'solana', 'tron']

function getChainFromPath() {
  const parts = document.location.pathname.split('/')
  if (parts.length !== 3) {
    throw new Error('location path not valid')
  }

  const chain = parts[1]
  if (!SUPPORT_CHAINS.includes(chain)) {
    throw new Error(`${chain} is not supported`)
  }

  return chain
}

function getExternalLinks(el: HTMLDivElement, chain: string) {
  const aEls = el.querySelectorAll('a[title="Open in block explorer"]')
  const aEl = aEls.item(1) as HTMLAnchorElement
  const address = aEl.href.split('/').pop()!

  return {
    gmgn: getGmGnLink(chain, address),
    bullx: getBullxLink(chain, address),
  }
}

function getGmGnLink(chain: string, token: string) {
  if (chain === 'ethereum') {
    return `https://gmgn.ai/eth/token/${token}`
  } else if (chain === 'base') {
    return `https://gmgn.ai/base/token/${token}`
  } else if (chain === 'solana') {
    return `https://gmgn.ai/sol/token/${token}`
  } else {
    logger.warn(`${chain} unsupported`)
    return null
  }
}

function getBullxLink(chain: string, token: string) {
  if (chain === 'ethereum') {
    return `https://bullx.io/terminal?chainId=1&address=${token}`
  } else if (chain === 'base') {
    return `https://bullx.io/terminal?chainId=8453&address=${token}`
  } else if (chain === 'solana') {
    return `https://bullx.io/terminal?chainId=1399811149&address=${token}`
  } else if (chain === 'tron') {
    return `https://tron.bullx.io/terminal?chainId=728126428&address=${token}`
  } else {
    logger.warn(`${chain} unsupported`)
    return null
  }
}

main()
