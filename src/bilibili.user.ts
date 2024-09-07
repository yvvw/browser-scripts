// ==UserScript==
// @name         Better Bilibili
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.1.3
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
// ==/UserScript==

import type { IBiliLivePlayer, IBiliPlayer, IBiliUser } from '../types/bilibili_global'
import { getNotFalsyValue, HTMLUtils, Logger } from './util'

const logger = Logger.new('Better Bilibili')

function main() {
  if (window.self !== window.top) return

  let player: IPlayer | undefined
  const href = document.location.href
  if (/live/.test(href)) {
    player = new LivePlayer()
  } else if (/video|list|bangumi|blackboard/.test(href)) {
    player = new VideoPlayer()
  }
  if (!player) {
    logger.warn('player not found')
    return
  }

  player.run(new BiliInject()).catch(logger.error)
}

interface IPlayer {
  run(inject: BiliInject): Promise<void>
}

class VideoPlayer implements IPlayer {
  async run(inject: BiliInject) {
    const [biliPlayer, biliUser] = await Promise.all([inject.getPlayer(), inject.getUser()])

    await Promise.allSettled([
      this.switchBestQuality(biliPlayer, biliUser).catch(logger.error),
      this.switchWebFullscreen().catch(logger.error),
    ])
  }

  async switchWebFullscreen() {
    const playerEl = await HTMLUtils.query(() =>
      document.querySelector<HTMLElement>('.bpx-player-ctrl-web')
    )
    if (playerEl.classList.contains('bpx-state-entered'))
      throw new Error('fullscreen button not found')
    playerEl.click()
  }

  async switchBestQuality(player: IBiliPlayer, user: IBiliUser['cache']['data']) {
    const current = player.getQuality().realQ
    const supported = player.getSupportedQualityList()
    const quality = !user.isLogin
      ? supported.find((it) => it < 64)!
      : this.#isVip(user)
        ? supported[0]
        : supported.find((it) => it < 112)!
    if (current !== quality) player.requestQuality(quality)
  }

  #isVip(user: IBiliUser['cache']['data']) {
    return user?.vipStatus === 1
  }
}

class LivePlayer implements IPlayer {
  async run(inject: BiliInject) {
    const livePlayer = await inject.getLivePlayer()

    await Promise.allSettled([
      this.hideChatPanel().catch(logger.error),
      this.scrollToPlayer().catch(logger.error),
      this.switchWebFullscreen().catch(logger.error),
      this.switchBestQuality(livePlayer).catch(logger.error),
    ])
  }

  async hideChatPanel() {
    const el = await HTMLUtils.query(() => document.getElementById('aside-area-toggle-btn'))
    el.click()
  }

  async scrollToPlayer() {
    const playerEl = await HTMLUtils.query(() => document.getElementById('live-player'))
    playerEl.scrollIntoView()
  }

  async switchWebFullscreen() {
    const playerEl = await HTMLUtils.query(() => document.getElementById('live-player'))
    playerEl.dispatchEvent(new MouseEvent('mousemove'))
    const areaEl = document.querySelector<HTMLElement>('.right-area')
    if (areaEl === null) throw new Error('player right area not found')
    const childEl = areaEl.children.item(1)
    if (childEl === null) throw new Error('fullscreen button not found')
    const spanEl = childEl.querySelector<HTMLElement>('span')
    if (spanEl === null) throw new Error('fullscreen button not found')
    spanEl.click()
  }

  async switchBestQuality(player: IBiliLivePlayer) {
    const current = player.getPlayerInfo().quality
    const support = player.getPlayerInfo().qualityCandidates.map((it) => it.qn)
    if (support.length === 0) throw new Error('support qualities is empty')
    const quality = support[0]
    if (current !== quality) player.switchQuality(quality)
  }
}

class BiliInject {
  async getUser() {
    return getNotFalsyValue(() => unsafeWindow.__BiliUser__?.cache?.data)
  }

  async getPlayer() {
    return getNotFalsyValue(() => unsafeWindow.player)
  }

  async getLivePlayer() {
    return getNotFalsyValue(() => unsafeWindow.livePlayer)
  }
}

main()
