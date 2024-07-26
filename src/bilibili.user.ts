// ==UserScript==
// @name         Better Bilibili
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.0.24
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
import { getNotFalsyValue, GM } from './util'

let hook: BiliHook

window.onload = async function main() {
  let player: IBiliPlayer | undefined
  const href = document.location.href
  if (/live/.test(href)) {
    player = new BiliLivePlayer()
  } else if (/video|list|bangumi|blackboard/.test(href)) {
    player = new BiliVideoPlayer()
  }
  if (!player) {
    console.warn('player not found')
    return
  }

  hook = new BiliHook()
  await hook.prepare()

  await player.optimistic()
}

interface IBiliPlayer {
  optimistic(): Promise<void>
}

class BiliVideoPlayer implements IBiliPlayer {
  async optimistic() {
    this.switchBestQuality()
    this.switchWebFullscreen()
  }

  switchWebFullscreen() {
    const el = document.querySelector<HTMLElement>('.bpx-player-ctrl-web')
    if (el === null) {
      console.warn('fullscreen button element not found')
      return
    }
    if (el.classList.contains('bpx-state-entered')) {
      console.warn('entered fullscreen button classname changed')
      return
    }
    el.click()
  }

  private get isVip() {
    return (hook.user?.cache?.data as IBiliUserLoginData)?.vipStatus === 1
  }

  switchBestQuality() {
    const player = hook.player!!
    const curr = player.getQuality().realQ
    const supported = player.getSupportedQualityList()
    const quality = this.isVip ? supported[0] : supported[supported.findIndex((it) => it < 112)]
    if (curr !== quality) player.requestQuality(quality)
  }
}

class BiliLivePlayer implements IBiliPlayer {
  async optimistic() {
    this.hideElements()
    this.hideChatPanel()
    this.switchBestQuality()
    this.switchWebFullscreen()
  }

  hideElements() {
    GM.addStyle('#my-dear-haruna-vm{display:none !important}')
  }

  hideChatPanel() {
    const el = document.querySelector<HTMLElement>('#aside-area-toggle-btn')
    if (el === null) {
      console.warn('chat panel element not found')
      return
    }
    el.click()
  }

  switchWebFullscreen() {
    const playerEl = document.querySelector<HTMLElement>('#live-player')
    if (playerEl === null) {
      console.warn('live player element not found')
      return
    }
    playerEl.dispatchEvent(new MouseEvent('mousemove'))
    const areaEl = document.querySelector<HTMLElement>('.right-area')
    if (areaEl === null) {
      console.warn('player right area element not found')
      return
    }
    const childEl = areaEl.children.item(1)
    if (childEl === null) {
      console.warn('fullscreen button element not found')
      return
    }
    const spanEl = childEl.querySelector<HTMLElement>('span')
    if (spanEl === null) {
      console.warn('fullscreen button element not found')
      return
    }
    spanEl.click()
  }

  switchBestQuality() {
    const player = hook.livePlayer!!
    const current = player.getPlayerInfo().quality
    const supported = player.getPlayerInfo().qualityCandidates.map((it) => it.qn)
    const quality = supported[0]
    if (current !== quality) player.switchQuality(quality)
  }
}

class BiliHook {
  async prepare() {
    return getNotFalsyValue(() => !!((this.user && this.player) || this.livePlayer), {
      interval: 1000,
    })
  }

  get user() {
    return unsafeWindow.__BiliUser__
  }

  get player() {
    return unsafeWindow.player
  }

  get livePlayer() {
    return unsafeWindow.livePlayer
  }
}
