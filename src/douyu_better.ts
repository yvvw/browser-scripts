// ==UserScript==
// @name         Better Douyu
// @namespace    https://github.com/yvvw/tampermonkey-scripts
// @version      0.0.3
// @description  移除不需要组件、网页全屏、最高可用清晰度
// @author       yvvw
// @icon         https://www.douyu.com/favicon.ico
// @license      MIT
// @updateURL    https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/douyu_better.user.js
// @downloadURL  https://ghproxy.com/https://github.com/yvvw/tampermonkey-scripts/releases/download/latest/douyu_better.user.js
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
// @grant        none
// ==/UserScript==

window.onload = async function main() {
  hideElement()
  await Promise.all([switchBestQuality(), switchWebFullscreen(), hideDanmuPanel()])
}

async function switchWebFullscreen() {
  await waitingElementLoaded('.wfs-2a8e83')
  const el = document.querySelector('.wfs-2a8e83') as HTMLElement | null
  if (el === null) return
  el.click()
}

async function switchBestQuality() {
  await waitingElementLoaded('.tipItem-898596')
  const el = document.querySelector('.tipItem-898596 > ul > li') as HTMLElement | null
  if (el === null) return
  el.click()
}

async function hideDanmuPanel() {
  await waitingElementLoaded('.layout-Player-asidetoggleButton')
  const el = document.querySelector('.layout-Player-asidetoggleButton') as HTMLElement | null
  if (el === null) return
  el.click()
}

async function waitingElementLoaded(selector: string, maxTimes = 100) {
  let times = 0
  while (true) {
    times++
    await new Promise((resolve) => setTimeout(resolve, 100))
    const el = document.querySelector(selector)
    if (el !== null) break
    if (times >= maxTimes) throw new Error(`Can't find \`${selector}\``)
  }
}

function hideElement() {
  const head = document.querySelector('head')
  if (head === null) return

  let css = '{display:none !important;height:0 !important}'
  css += '.layout-Player-rank{display:none !important}'
  css += '.layout-Player-barrage{top:0px !important;}'
  css += '.layout-Player-video{bottom:0px !important}'
  css += '.layout-Player-toolbar{visibility:hidden !important;}'
  css += '.layout-Bottom{display:none !important;}'
  css += '.guessGameContainer.is-normalRoom{display:none !important;}'
  css += '.DropPane-ad{display:none !important}'
  css += '.SignBaseComponent-sign-ad{display:none !important}'
  css += '.layout-Aside{display:none !important;}'
  css += '.Header-download-wrap{display:none !important;}'
  css += '.Header-broadcast-wrap{display:none !important;}'
  css += '#js-header > div > div > div.Header-left > div > ul > li:nth-child(5){display:none !important;}'
  css += '.ChatNobleBarrage{display:none !important;}'
  css += '.ChatFansBarrage{display:none !important;}'
  css += '.Horn4Category{display:none !important;}'
  css += '.FirePower{display:none !important;}'
  css += '.TreasureDetail{display:none !important;}'
  css += '.SignChatAd-chat-ad-cls{display:none !important;}'
  css += '.Promotion-nobleRights{display:none !important;}'
  css += '.Task{display:none !important;}'
  css += '.UPlayerLotteryEnter.is-active{display:none !important;}'
  css += '.LotteryContainer{display:none !important;}'
  css += '.layout-Module-head.FollowList-head.is-fixed{display:none !important;}'
  css += '.layout-Banner-item{display:none !important;}'
  css += '.layout-Module-extra{display:none !important;}'
  css += '.Title-roomOtherBottom{display:none !important;}'
  css += '.Act129684Bar-view1{display:none !important;}'
  css += '.Act129684Bar-content{display:none !important;}'
  css += '.Act129684-logo{display:none !important;}'
  css += '.ActBase-switch{display:none !important;}'
  css += '.HeaderNav{display:none !important;}'
  css += '.HeaderGif-left{display:none !important;}'
  css += '.HeaderGif-right{display:none !important;}'
  css += '.Prompt-container{display:none !important;}'
  css += '.SysSign-Ad{display:none !important;}'
  css += '.ActDayPay-toast{display:none !important;}'
  css += '.code_box-5cdf5a{display:none !important;}'
  css += '.normalDiv-8b686d{display:none !important;}'
  css += '.closeBg-998534{display:none !important;}'
  css += '.bg-d4758b{display:none !important;}'
  css += '.fireOpenRanking react-draggable react-draggable-dragged{display:none !important;}'
  css += '.vsFestival1908{display:none !important;}'
  css += '.ActSuperFansGroup-component.ActSuperFansGroupBar-normalBody{display:none !important;}'
  css += '.ActSuperFansGroup-component.ActSuperFansGroupBar-miniBody{display:none !important;}'
  css += '.ActSuperFansGroup-component.ActSuperFansGroupBar-plusBody{display:none !important;}'
  css += '.ActSuperFansGroup-logo{display:none !important;}'
  css += '.ActSuperFansGroup-switch{display:none !important;}'
  css += '.TitleSuperFansIcon{display:none !important;}'
  css += '.Act156581Bar{display:none !important;}'
  css += '.Act159742Bar-main--pre{display:none !important;}'
  css += '.Act159742-logo{display:none !important;}'
  css += '.Act159742Bar-wrap{display:none !important;}'
  css += '.Title-columnTag{display:none !important;}'
  css += '.Title-impress.clearFix{display:none !important;}'
  css += '#js-room-activity{display:none !important;}'
  css += '.TBarrage-hiIcon{display:none !important;}'
  css += 'span.UserLevel{display:none !important;}'
  css += '.FansMedal{display:none !important;}'
  css += 'span.Motor{display:none !important;}'
  css += 'span.Barrage-hiIcon{display:none !important;}'
  css += 'span.RoomLevel{display:none !important;}'
  css += 'span.Barrage-icon{display:none !important;}'
  css += 'a.ChatAchievement{display:none !important;}'
  css += 'section.layout-Customize{display:none !important;}'
  css += '.GuessGameMiniPanelB-wrapper{display:none !important;}'
  css += '.InteractPlayWithPendant{display:none !important;}'
  css += '.LiveRoomLoopVideo-thumb {display:none !important;}'
  css += '.PostReward-videoPendant {display:none !important;}'
  css += '.TVGameEntry-wrapper {display:none !important;}'
  css += '.FullPageFollowGuide {display:none !important;}'
  css += '.Title-roomInfo > .Title-row:nth-child(3) {display:none !important;}'

  const style = document.createElement('style')
  style.appendChild(document.createTextNode(css))
  head.appendChild(style)
}
