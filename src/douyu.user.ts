// ==UserScript==
// @name         Better Douyu
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.0.15
// @description  自动网页全屏、切换最高清晰度
// @author       yvvw
// @icon         https://www.douyu.com/favicon.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/douyu.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/douyu.user.js
// @match        https://www.douyu.com/directory/watchHistory
// @match        https://www.douyu.com/topic/*
// @match        https://www.douyu.com/0*
// @match        https://www.douyu.com/1*
// @match        https://www.douyu.com/2*
// @match        https://www.douyu.com/3*
// @match        https://www.douyu.com/4*
// @match        https://www.douyu.com/5*
// @match        https://www.douyu.com/6*
// @match        https://www.douyu.com/7*
// @match        https://www.douyu.com/8*
// @match        https://www.douyu.com/9*
// @noframes
// ==/UserScript==

import { HTMLUtils, Logger } from './util'

const logger = Logger.new('Better Douyu')

async function main() {
  if (location.pathname.includes('watchHistory')) return

  const container = await HTMLUtils.query(() => document.getElementById('__h5player'))

  new MutationObserver((mutations, observer) => {
    for (const mutation of mutations) {
      if (
        mutation.target.nodeType === Node.ELEMENT_NODE &&
        (mutation.target as HTMLElement).className.includes('broadcastDiv')
      ) {
        observer.disconnect()
        switchBestQuality()
        switchWebFullscreen()
        hideDanmuPanel()
        break
      }
    }
  }).observe(container, { childList: true, subtree: true, attributes: true })
}

function switchBestQuality() {
  HTMLUtils.query(() => document.querySelector('.tipItem-898596 > ul > li') as HTMLElement)
    .then((el) => el.click())
    .catch((err) => logger.error('switchBestQuality', err))
}

function switchWebFullscreen() {
  HTMLUtils.query(() => document.querySelector('.wfs-2a8e83') as HTMLElement)
    .then((el) => el.click())
    .catch((err) => logger.error('switchWebFullscreen', err))
}

function hideDanmuPanel() {
  HTMLUtils.query(() => document.querySelector('.layout-Player-asidetoggleButton') as HTMLElement)
    .then((el) => el.click())
    .catch((err) => logger.error('hideDanmuPanel', err))
}

main().catch(logger.error.bind(logger))
