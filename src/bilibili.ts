// ==UserScript==
// @name         Better Bilibili
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.0.23
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

import type { IBiliUserLoginData } from '../types/bilibili_hook'
import { GM } from './util'

let hook: BiliHook

window.onload = async function main() {
  const player = getPlayer()
  if (!player) return

  hook = new BiliHook()
  await hook.prepare()

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

class VideoPlayer implements IPlayer {
  async optimistic() {
    this.switchBestQuality()
    this.switchWebFullscreen()
  }

  switchWebFullscreen() {
    const el = document.querySelector<HTMLElement>('.bpx-player-ctrl-web')
    if (el === null) return
    if (el.classList.contains('bpx-state-entered')) return
    el.click()
  }

  private get user() {
    return unsafeWindow.__BiliUser__!!
  }

  private get isVip() {
    return (this.user.cache?.data as IBiliUserLoginData)?.vipStatus === 1
  }

  switchBestQuality() {
    const player = hook.player!!
    const current = player.getQuality().realQ
    const supported = player.getSupportedQualityList()
    let quality: number
    if (this.isVip) {
      quality = supported[0]
    } else {
      quality = supported[supported.findIndex((it) => it < 112)]
    }
    if (current !== quality) {
      player.requestQuality(quality)
    }
  }
}

class LivePlayer implements IPlayer {
  async optimistic() {
    this.hideElement()
    this.switchWebFullscreen()
    this.hideChatPanel()
    this.switchBestQuality()
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
    playerEl.dispatchEvent(new MouseEvent('mousemove'))
    const areaEl = document.querySelector<HTMLElement>('.right-area')
    if (areaEl === null) return
    const childEl = areaEl.children.item(1)
    if (childEl === null) return
    const spanEl = childEl.querySelector<HTMLElement>('span')
    if (spanEl === null) return
    spanEl.click()
  }

  switchBestQuality() {
    const player = hook.livePlayer!!
    const current = player.getPlayerInfo().quality
    const supported = player.getPlayerInfo().qualityCandidates.map((it) => it.qn)
    const quality = supported[0]
    if (current !== quality) {
      player.switchQuality(quality)
    }
  }
}

class BiliHook {
  async prepare(option?: { timeout?: number; interval?: number }) {
    return new Promise<void>((resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout>
      let interval: ReturnType<typeof setInterval>

      const clear = () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }

      if (option?.timeout && option.timeout > 0) {
        timeout = setTimeout(() => {
          clear()
          reject(new Error('Timeout'))
        }, option?.timeout ?? 10000)
      }

      interval = setInterval(() => {
        if ((unsafeWindow.__BiliUser__ && this.player) || this.livePlayer) {
          clear()
          resolve()
        }
      }, option?.interval ?? 100)
    })
  }

  get player() {
    return unsafeWindow.player
  }

  get livePlayer() {
    return unsafeWindow.livePlayer
  }
}
