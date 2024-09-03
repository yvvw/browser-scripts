// ==UserScript==
// @name         Better Bilibili
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.1.1
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
  biliAnime4k.run()
}

interface IBiliPlayer {
  optimistic(hook: BiliHook): Promise<void>
}

class BiliVideoPlayer implements IBiliPlayer {
  async optimistic(hook: BiliHook) {
    await Promise.allSettled([this.switchWebFullscreen(), this.switchBestQuality(hook)])
  }

  async switchWebFullscreen() {
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

type IBiliAnime4KPipelinePreset =
  | 'Anime4K: A'
  | 'Anime4K: B'
  | 'Anime4K: C'
  | 'Anime4K: A+A'
  | 'Anime4K: B+B'
  | 'Anime4K: C+A'

class BiliAnime4K {
  #presetKeyMap: { [key: string]: IBiliAnime4KPipelinePreset | 'Clear' } = {
    '`': 'Clear',
    '1': 'Anime4K: A',
    '2': 'Anime4K: A+A',
    '3': 'Anime4K: B',
    '4': 'Anime4K: B+B',
    '5': 'Anime4K: C',
    '6': 'Anime4K: C+A',
  }

  #keyboardListener: ((ev: KeyboardEvent) => void) | undefined

  run() {
    let lastPreset: string | undefined
    this.#keyboardListener = (ev: KeyboardEvent) => {
      const preset = this.#presetKeyMap[ev.key]
      if (preset === undefined) return
      if (preset === lastPreset) return this.#notice(preset)
      lastPreset = preset
      if (preset === 'Clear') {
        this.#clear()
      } else {
        this.#render({ preset }).catch(console.error)
      }
    }
    window.addEventListener('keydown', this.#keyboardListener)
  }

  #resizeObserver?: ResizeObserver

  #getPipelines(
    preset: IBiliAnime4KPipelinePreset,
    descriptor: Anime4KPresetPipelineDescriptor
  ): [...Anime4KPipeline[], Anime4KPipeline] {
    switch (preset) {
      case 'Anime4K: A':
        return [new anime4k.ModeA(descriptor)]
      case 'Anime4K: B':
        return [new anime4k.ModeB(descriptor)]
      case 'Anime4K: C':
        return [new anime4k.ModeC(descriptor)]
      case 'Anime4K: A+A':
        return [new anime4k.ModeAA(descriptor)]
      case 'Anime4K: B+B':
        return [new anime4k.ModeBB(descriptor)]
      case 'Anime4K: C+A':
        return [new anime4k.ModeCA(descriptor)]
      default:
        throw new Error(`unknown preset ${preset}`)
    }
  }

  async #render({ preset }: { preset: IBiliAnime4KPipelinePreset }) {
    const video = this.#getVideo()
    video.style.setProperty('visibility', 'hidden')

    const { videoWidth, videoHeight } = video
    const videoAspectRatio = videoWidth / videoHeight

    const canvas = this.#getCanvas(video.parentElement!)
    canvas.style.removeProperty('display')

    const debouncedRender = debounce(
      async ({ rectWidth, rectHeight }: { rectWidth: number; rectHeight: number }) => {
        const canvasWidth = rectWidth < rectHeight ? rectWidth : rectHeight * videoAspectRatio
        const canvasHeight = rectHeight < rectWidth ? rectHeight : rectWidth / videoAspectRatio
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        canvas.style.setProperty('left', `${(rectWidth - canvasWidth) / 2}px`)
        canvas.style.setProperty('top', `${(rectHeight - canvasHeight) / 2}px`)

        canvas.getContext('webgpu')?.unconfigure()
        await anime4k.render({
          video,
          canvas,
          pipelineBuilder: (device, inputTexture) =>
            this.#getPipelines(preset, {
              nativeDimensions: { width: videoWidth, height: videoHeight },
              targetDimensions: { width: canvasWidth, height: canvasHeight },
              device,
              inputTexture,
            }),
        })
      },
      100,
      { immediate: false }
    )
    debouncedRender({ rectWidth: video.clientWidth, rectHeight: video.clientHeight })

    this.#resizeObserver?.disconnect()
    this.#resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0) return
      const entry = entries[0]
      if (!(entry.target instanceof HTMLVideoElement)) return this.#clear()
      debouncedRender({ rectWidth: entry.contentRect.width, rectHeight: entry.contentRect.height })
    })
    this.#resizeObserver!.observe(video)

    this.#notice(preset)
  }

  #clear() {
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect()
      this.#resizeObserver = undefined
    }

    const video = this.#getVideo()
    video.style.removeProperty('visibility')

    const canvas = this.#getCanvas(video.parentElement!)
    canvas.style.setProperty('display', 'none')
    canvas.getContext('webgpu')?.unconfigure()

    this.#notice('Clear')
  }

  #video?: HTMLVideoElement

  #getVideo() {
    if (!this.#video) {
      const video = document.querySelector('video')
      if (video === null) {
        throw new Error('video not found')
      }
      this.#video = video
    }
    return this.#video!
  }

  #canvasId = '__gpu-canvas__'

  #getCanvas(container: HTMLElement): HTMLCanvasElement {
    let canvas = document.getElementById(this.#canvasId) as HTMLCanvasElement | null
    if (canvas !== null) return canvas

    canvas = document.createElement('canvas')
    canvas.id = this.#canvasId
    canvas.style.setProperty('position', 'absolute')
    container.appendChild(canvas)

    return canvas
  }

  #noticeTimer?: ReturnType<typeof setTimeout>
  #noticeId = '__gpu-notice__'

  #notice(text: string) {
    const container = this.#getVideo().parentElement!
    if (container !== null) this.#notice1(container, text)
  }

  #notice1(container: HTMLElement, text: string) {
    let noticeEl = document.getElementById(this.#noticeId)
    if (noticeEl === null) {
      noticeEl = document.createElement('div')
      noticeEl.id = this.#noticeId
      noticeEl.style.setProperty('position', 'absolute')
      noticeEl.style.setProperty('z-index', '1')
      noticeEl.style.setProperty('top', '12px')
      noticeEl.style.setProperty('left', '12px')
      noticeEl.style.setProperty('padding', '12px')
      noticeEl.style.setProperty('background', '#4b4b4be6')
      noticeEl.style.setProperty('border-radius', '5px')
      noticeEl.style.setProperty('font-size', '2rem')
      noticeEl.style.setProperty('color', 'white')
      noticeEl.style.setProperty('transition', 'opacity 0.3s')
      container.appendChild(noticeEl)
    }

    noticeEl.innerText = text
    noticeEl.style.setProperty('opacity', '1')

    clearTimeout(this.#noticeTimer)
    this.#noticeTimer = setTimeout(() => noticeEl.style.setProperty('opacity', '0'), 1500)
  }

  destroy() {
    this.#clear()

    if (this.#keyboardListener) {
      window.removeEventListener('keydown', this.#keyboardListener)
      this.#keyboardListener = undefined
    }

    this.#destroyById(this.#canvasId)
    this.#destroyById(this.#noticeId)
  }

  #destroyById(id: string) {
    let el = document.getElementById(id)
    if (el !== null) el.parentElement?.removeChild(el)
  }
}
