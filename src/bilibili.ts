// ==UserScript==
// @name         Better Bilibili
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.19
// @description  移除不需要组件、网页全屏、最高可用清晰度
// @author       yvvw
// @icon         https://www.bilibili.com/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/bilibili.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/bilibili.user.js
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @match        https://www.bilibili.com/bangumi/play/*
// @match        https://www.bilibili.com/blackboard/*
// @match        https://live.bilibili.com/*
// @grant        none
// ==/UserScript==

import { delay } from './util'

let vip = false

window.onload = async function main() {
  const player = getPlayer()
  if (!player) return

  const api = new BilibiliApi()
  vip = await api.isVip()

  await player.prepare()
  await delay(1000)
  player.optimistic()
  player.daemon()
}

interface IPlayer {
  prepare(): Promise<void>
  optimistic(): void
  daemon(): void
}

function getPlayer(): IPlayer | undefined {
  let player: IPlayer | undefined
  const href = document.location.href
  if (/live/.test(href)) {
    player = new LivePlayer()
  } else if (/video|list|bangumi|blackboard/.test(href)) {
    player = new VideoPlayer()
  }
  return player
}

class LivePlayer implements IPlayer {
  optimistic() {
    this.hideElement()
    this.switchWebFullscreen()
    this.switchBestQuality()
    this.hideChatPanel()
  }

  daemon() {
    setTimeout(() => {
      this.switchBestQuality()
      this.daemon()
    }, 60000)
  }

  async prepare() {
    return new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (document.querySelector('video')) {
          resolve()
          observer.disconnect()
        }
      })
      observer.observe(document.body, { subtree: true, childList: true })
    })
  }

  hideElement() {
    const head = document.querySelector('head')
    if (head === null) return
    const css = '#my-dear-haruna-vm{display:none !important}'
    const style = document.createElement('style')
    style.appendChild(document.createTextNode(css))
    head.appendChild(style)
  }

  hideChatPanel() {
    const el = document.querySelector('#aside-area-toggle-btn') as HTMLElement | null
    if (el === null) return
    el.click()
  }

  switchWebFullscreen() {
    const playerEl = document.querySelector('#live-player') as HTMLElement | null
    if (playerEl === null) return
    const event = new MouseEvent('mousemove', {
      view: window,
    })
    playerEl.dispatchEvent(event)
    const id = setTimeout(() => playerEl.dispatchEvent(event), 1000)
    const areaEl = document.querySelector('.right-area')
    if (areaEl === null) return clearTimeout(id)
    const childEl = areaEl.children.item(1)
    if (childEl === null) return clearTimeout(id)
    const spanEl = childEl.querySelector('span') as HTMLElement | null
    if (spanEl === null) return clearTimeout(id)
    spanEl.click()
    clearTimeout(id)
  }

  switchBestQuality() {
    // @ts-ignore
    const livePlayer = window.livePlayer || window.top.livePlayer
    if (!livePlayer) return
    const playerInfo = livePlayer.getPlayerInfo()
    const qualityCandidates = playerInfo.qualityCandidates
    if (qualityCandidates.length === 0) return
    if (qualityCandidates[0].qn === playerInfo.quality) return
    livePlayer.switchQuality(qualityCandidates[0].qn)
  }
}

class VideoPlayer implements IPlayer {
  static CONFIG = {
    bigVipQualityClassName: 'bpx-player-ctrl-quality-badge-bigvip',
    qualitySelector: 'ul.bpx-player-ctrl-quality-menu',
    activeQualityClassName: 'bpx-state-active',
    webFullscreenSelector: '.bpx-player-ctrl-web',
    activeWebFullscreenClassName: 'bpx-state-entered',
  }

  async optimistic() {
    this.switchWebFullscreen()
    this.switchBestQuality()
  }

  daemon() {
    setTimeout(() => {
      this.switchBestQuality()
      this.daemon()
    }, 60000)
  }

  async prepare() {
    return new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (document.querySelector(VideoPlayer.CONFIG.webFullscreenSelector)) {
          resolve()
          observer.disconnect()
        }
      })
      observer.observe(document.body, { subtree: true, childList: true })
    })
  }

  switchWebFullscreen() {
    const el = document.querySelector(
      VideoPlayer.CONFIG.webFullscreenSelector
    ) as HTMLElement | null
    if (el === null) return
    if (el.classList.contains(VideoPlayer.CONFIG.activeWebFullscreenClassName)) return
    el.click()
  }

  switchBestQuality() {
    const el = document.querySelector(VideoPlayer.CONFIG.qualitySelector)
    if (el === null) return
    const length = el.children.length
    for (let i = 0; i < length; i++) {
      const childEl = el.children.item(i) as HTMLElement | null
      if (childEl === null) break
      if (childEl.classList.contains(VideoPlayer.CONFIG.activeQualityClassName)) break
      if (!vip && this.isBigVipQuality(childEl)) continue
      childEl.click()
    }
  }

  isBigVipQuality(el: HTMLElement) {
    if (!VideoPlayer.CONFIG.bigVipQualityClassName) return false
    const length = el.children.length
    for (let i = 0; i < length; i++) {
      const childEl = el.children.item(i) as HTMLElement | null
      if (childEl === null) break
      if (childEl.classList.contains(VideoPlayer.CONFIG.bigVipQualityClassName)) {
        return true
      }
    }
    return false
  }
}

class BilibiliApi {
  constructor(private url = 'https://api.bilibili.com') {}

  async fetchNavInfo() {
    const res = await fetch(`${this.url}/x/web-interface/nav`, {
      credentials: 'include',
    })
    const data = (await res.json()) as IBilibiliNavInfo
    if (data.code !== 0) throw new Error(`NavInfo ${data.message}`)
    return data.data
  }

  async isVip() {
    const navInfo = await this.fetchNavInfo()
    return navInfo.isLogin && navInfo.vipStatus === 1
  }
}

interface IBilibiliResponse<D> {
  code: number
  data: D
  message: string
}

type IBilibiliNavInfo = IBilibiliResponse<{
  isLogin: boolean
  vipStatus: number
}>
