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

window.onload = main

async function main() {
  const config = Config.getConfig()
  if (config === null) return

  await waitingRender(config)
  hideElement()
  selectBestQuality(config)
  setWebFullscreen(config)
}

async function waitingRender(config: IConfig) {
  if (!config.waitSelector) return
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const el = document.querySelector(config.waitSelector)
    if (el !== null) break
  }
}

function hideElement() {
  const head = document.querySelector('head')
  if (head === null) return

  let css = '#my-dear-haruna-vm{display:none !important}'

  const style = document.createElement('style')
  style.type = 'text/css'
  style.appendChild(document.createTextNode(css))

  head.appendChild(style)
}

function selectBestQuality(config: IConfig) {
  if (config.type === 'live') {
    selectLiveBestQuality()
    return
  }
  if (!config.qualitySelector || !config.activeQualityClassName) return
  const el = document.querySelector(config.qualitySelector)
  if (el === null) return
  const length = el.children.length
  for (let i = 0; i < length; i++) {
    const childEl = el.children.item(i) as HTMLElement | null
    if (childEl === null) break
    if (childEl.classList.contains(config.activeQualityClassName)) break
    if (isBigVipQuality(childEl, config)) continue
    childEl.click()
  }
}

function isBigVipQuality(el: HTMLElement, config: IConfig) {
  if (!config.bigVipQualityClassName) return false
  const length = el.children.length
  for (let i = 0; i < length; i++) {
    const childEl = el.children.item(i) as HTMLElement | null
    if (childEl === null) break
    if (childEl.classList.contains(config.bigVipQualityClassName)) {
      return true
    }
  }
  return false
}

function selectLiveBestQuality() {
  // @ts-ignore
  const livePlayer = window.livePlayer || window.top.livePlayer
  if (!livePlayer) return
  const playerInfo = livePlayer.getPlayerInfo()
  const qualityCandidates = playerInfo.qualityCandidates
  if (qualityCandidates.length === 0) return
  if (qualityCandidates[0].qn === playerInfo.quality) return
  livePlayer.switchQuality(qualityCandidates[0].qn)
}

function setWebFullscreen(config: IConfig) {
  if (!config.webFullscreenSelector || !config.activeWebFullscreenClassName) return
  const el = document.querySelector(config.webFullscreenSelector) as HTMLElement | null
  console.log(el)
  if (el === null) return
  if (el.classList.contains(config.activeWebFullscreenClassName)) return
  el.click()
}

interface IConfig {
  type: string
  waitSelector?: string
  bigVipQualityClassName?: string
  qualitySelector?: string
  activeQualityClassName?: string
  webFullscreenSelector?: string
  activeWebFullscreenClassName?: string
}

class Config {
  static #PAGE_CONFIG: { [key: string]: IConfig } = {
    live: {
      type: 'live',
      waitSelector: 'video',
    },
    video: {
      type: 'video',
      waitSelector: '.bpx-player-ctrl-web',
      qualitySelector: 'ul.bpx-player-ctrl-quality-menu',
      activeQualityClassName: 'bpx-state-active',
      webFullscreenSelector: '.bpx-player-ctrl-web',
      activeWebFullscreenClassName: 'bpx-state-entered',
    },
    bangumi: {
      type: 'bangumi',
      waitSelector: '.squirtle-video-pagefullscreen',
      bigVipQualityClassName: 'squirtle-bigvip',
      qualitySelector: 'ul.squirtle-quality-select-list',
      activeQualityClassName: 'active',
      webFullscreenSelector: '.squirtle-video-pagefullscreen',
      activeWebFullscreenClassName: 'active',
    },
  }

  static getConfig() {
    const keys = Object.keys(this.#PAGE_CONFIG)
    const href = document.location.href
    for (const key of keys) {
      if (href.match(key) != null) {
        return this.#PAGE_CONFIG[key]
      }
    }
    return null
  }
}
