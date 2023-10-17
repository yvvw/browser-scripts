// ==UserScript==
// @name         Better Bilibili
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.12
// @description  移除不需要组件、网页全屏、最高可用清晰度
// @author       yvvw
// @icon         https://www.bilibili.com/favicon.ico
// @license      MIT
// @updateURL    https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/bilibili_better.user.js
// @downloadURL  https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/bilibili_better.user.js
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @match        https://www.bilibili.com/bangumi/play/*
// @match        https://www.bilibili.com/blackboard/*
// @match        https://live.bilibili.com/*
// @grant        none
// ==/UserScript==

let IS_VIP = false

window.onload = async function main() {
  const player = getPlayer()
  if (!player) return

  const api = new BiApi('https://api.bilibili.com')

  const [isVip] = await Promise.all([api.isVip(), player.prepare()])
  IS_VIP = isVip

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
  if (href.match('live')) {
    player = new LivePlayer()
  } else {
    const match = href.match(/video|list|bangumi|blackboard/)
    if (match) {
      player = new VideoPlayer(match[0] as IVideoType)
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

  daemon() {
    setTimeout(() => {
      this.switchBestQuality()
      this.daemon()
    }, 60000)
  }

  async prepare(maxTimes = 30) {
    let times = 0
    while (true) {
      times++
      await new Promise((resolve) => setTimeout(resolve, 500))
      const el = document.querySelector('video')
      if (el !== null) break
      if (times >= maxTimes) throw new Error("Can't find `video`")
    }
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

interface IVideoConfig {
  waitSelector?: string
  bigVipQualityClassName?: string
  qualitySelector?: string
  activeQualityClassName?: string
  webFullscreenSelector?: string
  activeWebFullscreenClassName?: string
}

type IVideoType = 'video' | 'list' | 'bangumi' | 'blackboard'

class VideoPlayer implements IPlayer {
  static CONFIG = {
    'video|list|blackboard': {
      waitSelector: 'ul.bpx-player-ctrl-quality-menu',
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
  } as const

  config: IVideoConfig

  constructor(type: IVideoType) {
    let config: IVideoConfig | undefined
    for (const key of Object.keys(VideoPlayer.CONFIG)) {
      if (key.includes(type)) {
        // @ts-ignore
        config = VideoPlayer.CONFIG[key]
      }
    }
    if (!config) throw new Error(`Can't find config for ${type}`)

    this.config = config
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

  async prepare(maxTimes = 30) {
    if (!this.config.waitSelector) return
    let times = 0
    while (true) {
      times++
      await new Promise((resolve) => setTimeout(resolve, 500))
      const el = document.querySelector(this.config.waitSelector)
      if (el !== null) break
      if (times >= maxTimes) throw new Error(`Can't find \`${this.config.waitSelector}\``)
    }
  }

  switchWebFullscreen() {
    if (!this.config.webFullscreenSelector || !this.config.activeWebFullscreenClassName) return
    const el = document.querySelector(this.config.webFullscreenSelector) as HTMLElement | null
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
      if (!IS_VIP && this.isBigVipQuality(childEl)) continue
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

class BiApi {
  constructor(private url: string) {}

  async getNavInfo() {
    const res = await fetch(`${this.url}/x/web-interface/nav`, {
      credentials: 'include',
    })
    const data = (await res.json()) as IBiNavInfo
    if (data.code !== 0) throw new Error(`NavInfo ${data.message}`)
    return data.data
  }

  async isVip() {
    const navInfo = await this.getNavInfo()
    return navInfo.isLogin && navInfo.vipStatus === 1
  }
}

interface IBiResponse<D> {
  code: number
  data: D
  message: string
}

type IBiNavInfo = IBiResponse<{
  isLogin: boolean
  vipStatus: number
}>
