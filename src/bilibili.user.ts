// ==UserScript==
// @name         Better Bilibili
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.1.0
// @description  移除不需要组件、网页全屏、最高可用清晰度、Anime4K画质增强
// @credit       https://github.com/bloc97/Anime4K
// @credit       https://github.com/Anime4KWebBoost/Anime4K-WebGPU
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

import type { Anime4KPipeline, Anime4KPresetPipelineDescriptor } from 'anime4k-webgpu'
import * as anime4k from 'anime4k-webgpu'
import debounce from 'debounce'

import type { IBiliUserLoginData } from '../types/bilibili_hook'
import { getNotFalsyValue, GM, HTMLUtils } from './util'

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

  const hook = new BiliHook()
  await player.optimistic(hook)

  const biliAnime4k = new BiliAnime4K()
  biliAnime4k.monitor()
}

interface IBiliPlayer {
  optimistic(hook: BiliHook): Promise<void>
}

class BiliVideoPlayer implements IBiliPlayer {
  async optimistic(hook: BiliHook) {
    await Promise.allSettled([this.switchWebFullscreen(hook), this.switchBestQuality(hook)])
  }

  async switchWebFullscreen(hook: BiliHook) {
    const playerEl = await HTMLUtils.query(() =>
      document.querySelector<HTMLElement>('.bpx-player-ctrl-web')
    )
    if (playerEl.classList.contains('bpx-state-entered')) {
      console.warn('entered fullscreen button classname changed')
      return
    }
    playerEl.click()
  }

  private isVip(hook: BiliHook) {
    return (hook.user?.cache?.data as IBiliUserLoginData)?.vipStatus === 1
  }

  async switchBestQuality(hook: BiliHook) {
    const player = await getNotFalsyValue(() => hook.player)
    const curr = player.getQuality().realQ
    const supported = player.getSupportedQualityList()
    const quality = this.isVip(hook)
      ? supported[0]
      : supported[supported.findIndex((it) => it < 112)]
    if (curr !== quality) player.requestQuality(quality)
  }
}

class BiliLivePlayer implements IBiliPlayer {
  async optimistic(hook: BiliHook) {
    this.hideElements()
    await this.scrollToPlayer().catch(console.error)
    await Promise.allSettled([this.hideChatPanel(), this.switchBestQuality(hook)])
    await this.switchWebFullscreen()
  }

  hideElements() {
    GM.addStyle('#my-dear-haruna-vm{display:none !important}')
  }

  async hideChatPanel() {
    const el = await HTMLUtils.query(() =>
      document.querySelector<HTMLElement>('#aside-area-toggle-btn')
    )
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

  async switchBestQuality(hook: BiliHook) {
    const player = await getNotFalsyValue(() => hook.livePlayer)
    const current = player.getPlayerInfo().quality
    const supported = player.getPlayerInfo().qualityCandidates.map((it) => it.qn)
    const quality = supported[0]
    if (current !== quality) player.switchQuality(quality)
  }
}

class BiliHook {
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

type IBiliAnime4KPipelineMode =
  | 'Mode A'
  | 'Mode B'
  | 'Mode C'
  | 'Mode A+A'
  | 'Mode B+B'
  | 'Mode C+A'

class BiliAnime4K {
  private getPipelines(
    mode: IBiliAnime4KPipelineMode,
    descriptor: Anime4KPresetPipelineDescriptor
  ): [...Anime4KPipeline[], Anime4KPipeline] {
    switch (mode) {
      case 'Mode A':
        return [new anime4k.ModeA(descriptor)]
      case 'Mode B':
        return [new anime4k.ModeB(descriptor)]
      case 'Mode C':
        return [new anime4k.ModeC(descriptor)]
      case 'Mode A+A':
        return [new anime4k.ModeAA(descriptor)]
      case 'Mode B+B':
        return [new anime4k.ModeBB(descriptor)]
      case 'Mode C+A':
        return [new anime4k.ModeCA(descriptor)]
      default:
        throw new Error(`unknown mode ${mode}`)
    }
  }

  #keyboardListener: ((ev: KeyboardEvent) => void) | undefined

  monitor() {
    const getModeByKey = (key: string) => {
      switch (key) {
        case '`':
          return 'CLEAR'
        case '1':
          return 'Mode A'
        case '2':
          return 'Mode A+A'
        case '3':
          return 'Mode B'
        case '4':
          return 'Mode B+B'
        case '5':
          return 'Mode C'
        case '6':
          return 'Mode C+A'
      }
    }
    let lastMode: string | undefined
    this.#keyboardListener = (ev: KeyboardEvent) => {
      const mode = getModeByKey(ev.key)
      if (mode === lastMode) {
        if (mode !== undefined) this.notice(document.querySelector('video')!, mode)
        return
      }
      lastMode = mode
      if (mode === undefined) {
        return
      } else if (mode === 'CLEAR') {
        this.stopRender()
      } else {
        this.render({ mode }).catch(console.error)
      }
    }
    window.addEventListener('keydown', this.#keyboardListener)
  }

  #observer: ResizeObserver | undefined

  async render({ mode }: { mode: IBiliAnime4KPipelineMode }) {
    const video = document.querySelector('video')
    if (video === null) {
      console.warn('video is not exist')
      return
    }
    video.style.setProperty('visibility', 'hidden')

    const { canvas, created } = this.getCanvas()
    if (created) {
      video.parentElement!.appendChild(canvas)
    }

    if (this.#observer) {
      this.#observer.disconnect()
    }

    const render = debounce(
      async ({ rectWidth, rectHeight }: { rectWidth: number; rectHeight: number }) => {
        const { videoWidth, videoHeight } = video
        const aspectRatio = videoWidth / videoHeight
        const canvasWidth = rectWidth < rectHeight ? rectWidth : rectHeight * aspectRatio
        const canvasHeight = rectHeight < rectWidth ? rectHeight : rectWidth / aspectRatio
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        canvas.style.setProperty('left', `${(rectWidth - canvasWidth) / 2}px`)
        canvas.style.setProperty('top', `${(rectHeight - canvasHeight) / 2}px`)

        await anime4k.render({
          video,
          canvas,
          pipelineBuilder: (device, inputTexture) =>
            this.getPipelines(mode, {
              nativeDimensions: { width: videoWidth, height: videoHeight },
              targetDimensions: { width: videoWidth * 2, height: videoHeight * 2 },
              device,
              inputTexture,
            }),
        })
      },
      100,
      { immediate: false }
    )

    this.#observer = new ResizeObserver((entries) => {
      if (entries.length === 0) return
      const entry = entries[0]
      if (!(entry.target instanceof HTMLVideoElement)) {
        this.stopRender()
        return
      }
      render({ rectWidth: entry.contentRect.width, rectHeight: entry.contentRect.height })
    })
    this.#observer!.observe(video)

    await render({ rectWidth: video.clientWidth, rectHeight: video.clientHeight })

    this.notice(video, mode)
  }

  stopRender() {
    this.#observer?.disconnect()
    this.#observer = undefined
    const canvas = document.getElementById('gpu-canvas')
    if (canvas) canvas.parentElement!.removeChild(canvas)
    const video = document.querySelector('video')
    if (video) {
      video.style.removeProperty('visibility')
      this.notice(video, 'Clear')
    }
  }

  stop() {
    this.stopRender()
    if (this.#keyboardListener) {
      window.removeEventListener('keydown', this.#keyboardListener)
      this.#keyboardListener = undefined
    }
  }

  private getCanvas() {
    const id = 'gpu-canvas'

    let canvas = document.getElementById(id) as HTMLCanvasElement | null
    if (canvas !== null) return { canvas, created: false }

    canvas = document.createElement('canvas')
    canvas.id = id
    canvas.style.setProperty('position', 'absolute')
    return { canvas, created: true }
  }

  #noticeTimer: ReturnType<typeof setTimeout> | undefined

  private notice(video: HTMLVideoElement, text: string) {
    const id = 'gpu-notice'

    let div = document.getElementById(id)
    if (div === null) {
      div = document.createElement('div')
      div.id = id
      div.style.setProperty('position', 'absolute')
      div.style.setProperty('z-index', '1')
      div.style.setProperty('top', '12px')
      div.style.setProperty('left', '12px')
      div.style.setProperty('padding', '12px')
      div.style.setProperty('background', '#4b4b4be6')
      div.style.setProperty('border-radius', '5px')
      div.style.setProperty('font-size', '2rem')
      div.style.setProperty('color', 'white')
      video.parentElement!.appendChild(div)
    }

    div.innerText = text

    clearTimeout(this.#noticeTimer)
    this.#noticeTimer = setTimeout(() => video.parentElement!.removeChild(div), 1500)
  }
}
