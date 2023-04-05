// ==UserScript==
// @name         Better Bilibili
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.3
// @description  移除不需要组件、网页全屏、最高可用清晰度
// @author       yvvw
// @icon         https://www.bilibili.com/favicon.ico
// @license      MIT
// @updateURL    https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/raw/main/dist/bilibili_better.user.js
// @downloadURL  https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/raw/main/dist/bilibili_better.user.js
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/bangumi/play/*
// @match        https://live.bilibili.com/*
// @grant        none
// ==/UserScript==

window.onload = main

async function main() {
  const player = getPlayer()
  if (!player) return

  await player.wait()
  player.optimistic()
}

interface IPlayer {
  wait(): Promise<any>

  optimistic()
}

function getPlayer(): IPlayer | undefined {
  let player: IPlayer | undefined
  const href = document.location.href
  if (href.match('live')) {
    player = new LivePlayer()
  } else {
    const match = href.match(/video|bangumi/)
    if (match) {
      player = new VideoPlayer(match[0] as 'video' | 'bangumi')
    }
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

  async wait() {
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      const el = document.querySelector('video')
      if (el !== null) break
    }
  }

  hideElement() {
    const head = document.querySelector('head')
    if (head === null) return
    let css = '#my-dear-haruna-vm{display:none !important}'
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

interface IVideoConfig {
  waitSelector?: string
  bigVipQualityClassName?: string
  qualitySelector?: string
  activeQualityClassName?: string
  webFullscreenSelector?: string
  activeWebFullscreenClassName?: string
}

class VideoPlayer implements IPlayer {
  static CONFIG = {
    video: {
      waitSelector: '.bpx-player-ctrl-web',
      bigVipQualityClassName: 'bpx-player-ctrl-quality-badge-bigvip',
      qualitySelector: 'ul.bpx-player-ctrl-quality-menu',
      activeQualityClassName: 'bpx-state-active',
      webFullscreenSelector: '.bpx-player-ctrl-web',
      activeWebFullscreenClassName: 'bpx-state-entered',
    },
    bangumi: {
      waitSelector: '.squirtle-video-pagefullscreen',
      bigVipQualityClassName: 'squirtle-bigvip',
      qualitySelector: 'ul.squirtle-quality-select-list',
      activeQualityClassName: 'active',
      webFullscreenSelector: '.squirtle-video-pagefullscreen',
      activeWebFullscreenClassName: 'active',
    },
  }

  config: IVideoConfig

  constructor(type: 'video' | 'bangumi') {
    this.config = VideoPlayer.CONFIG[type]
  }

  async optimistic() {
    this.switchWebFullscreen()
    this.switchBestQuality()
  }

  async wait() {
    if (!this.config.waitSelector) return
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      const el = document.querySelector(this.config.waitSelector)
      if (el !== null) break
    }
  }

  switchWebFullscreen() {
    if (!this.config.webFullscreenSelector || !this.config.activeWebFullscreenClassName) return
    const el = document.querySelector(this.config.webFullscreenSelector) as HTMLElement | null
    console.log(el)
    if (el === null) return
    if (el.classList.contains(this.config.activeWebFullscreenClassName)) return
    el.click()
  }

  switchBestQuality() {
    if (!this.config.qualitySelector || !this.config.activeQualityClassName) return
    const el = document.querySelector(this.config.qualitySelector)
    if (el === null) return
    const length = el.children.length
    for (let i = 0; i < length; i++) {
      const childEl = el.children.item(i) as HTMLElement | null
      if (childEl === null) break
      if (childEl.classList.contains(this.config.activeQualityClassName)) break
      if (this.isBigVipQuality(childEl)) continue
      childEl.click()
    }
  }

  isBigVipQuality(el: HTMLElement) {
    if (!this.config.bigVipQualityClassName) return false
    const length = el.children.length
    for (let i = 0; i < length; i++) {
      const childEl = el.children.item(i) as HTMLElement | null
      if (childEl === null) break
      if (childEl.classList.contains(this.config.bigVipQualityClassName)) {
        return true
      }
    }
    return false
  }
}
