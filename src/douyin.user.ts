// ==UserScript==
// @name         Better Douyin
// @namespace    https://github.com/yvvw/browser-scripts
// @homepageURL  https://github.com/yvvw/browser-scripts/blob/main/src/douyin.user.ts
// @version      0.0.3
// @description  自动网页全屏、关闭礼物特效
// @author       yvvw
// @icon         https://www.douyin.com/favicon.ico
// @license      MIT
// @updateURL    https://ghp.ci/https://github.com/yvvw/browser-scripts/releases/download/latest/douyin.meta.js
// @downloadURL  https://ghp.ci/https://github.com/yvvw/browser-scripts/releases/download/latest/douyin.user.js
// @match        https://live.douyin.com/*
// @noframes
// ==/UserScript==

import { HTMLUtils, Logger } from './util'

const logger = Logger.new('Better Douyin')

window.onload = function main() {
  hideGift()
  switchWebFullscreen()
}

function hideGift() {
  HTMLUtils.query(() =>
    HTMLUtils.getFirstElementByXPath<HTMLDivElement>('//div[text()="屏蔽礼物特效"]')
  )
    .then((el) => (el.nextElementSibling! as HTMLDivElement).click())
    .catch((err) => logger.error('hideGift', err))
}

function switchWebFullscreen() {
  HTMLUtils.query(() =>
    HTMLUtils.getFirstElementByXPath<HTMLSpanElement>('//span[text()="网页全屏"]')
  )
    .then((el) => (el.parentElement!.parentElement!.nextElementSibling as HTMLDivElement).click())
    .catch((err) => logger.error('switchWebFullscreen', err))
}
