// ==UserScript==
// @name         Better Bilibili
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.0.21
// @description  移除不需要组件、网页全屏、最高可用清晰度
// @author       yvvw
// @icon         https://www.bilibili.com/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/bilibili.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/bilibili.user.js
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @match        https://www.bilibili.com/bangumi/play/*
// @match        https://www.bilibili.com/blackboard/*
// @match        https://live.bilibili.com/*
// @grant        unsafeWindow
// @grant        GM_addStyle
// ==/UserScript==

import { GM, HTMLUtils } from './util'

let vip = false

window.onload = async function main() {
  const player = getPlayer()
  if (!player) return

  const api = new BilibiliApi()
  vip = await api.isVip()

  await player.optimistic()
}

interface IPlayer {
  optimistic(): Promise<void>
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
  async optimistic() {
    await HTMLUtils.waitingElement(() => document.querySelector('video'))
    this.hideElement()
    this.switchWebFullscreen()
    this.switchBestQuality()
    this.hideChatPanel()
  }

  hideElement() {
    const css = '#my-dear-haruna-vm{display:none !important}'
    GM.addStyle(css)
  }

  hideChatPanel() {
    const el = document.querySelector<HTMLElement>('#aside-area-toggle-btn')
    if (el === null) return
    el.click()
  }

  switchWebFullscreen() {
    const playerEl = document.querySelector<HTMLElement>('#live-player')
    if (playerEl === null) return
    playerEl.dispatchEvent(new MouseEvent('mousemove', { view: unsafeWindow }))
    const areaEl = document.querySelector<HTMLElement>('.right-area')
    if (areaEl === null) return
    const childEl = areaEl.children.item(1)
    if (childEl === null) return
    const spanEl = childEl.querySelector<HTMLElement>('span')
    if (spanEl === null) return
    spanEl.click()
  }

  switchBestQuality() {
    // @ts-ignore
    const livePlayer = unsafeWindow.livePlayer || unsafeWindow.top.livePlayer
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
    await HTMLUtils.waitingElement(() =>
      document.querySelector(VideoPlayer.CONFIG.webFullscreenSelector)
    )
    this.switchWebFullscreen()
    this.switchBestQuality()
  }

  switchWebFullscreen() {
    const el = document.querySelector<HTMLElement>(VideoPlayer.CONFIG.webFullscreenSelector)
    if (el === null) return
    if (el.classList.contains(VideoPlayer.CONFIG.activeWebFullscreenClassName)) return
    el.click()
  }

  switchBestQuality() {
    const el = document.querySelector(VideoPlayer.CONFIG.qualitySelector)
    if (el === null) return
    const length = el.children.length
    for (let i = 0; i < length; i++) {
      const childEl = el.children.item(i) as HTMLElement
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
      const childEl = el.children.item(i) as HTMLElement
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
