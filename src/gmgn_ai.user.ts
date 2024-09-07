// ==UserScript==
// @name         Better GMGN.ai
// @namespace    https://github.com/yvvw/browser-scripts
// @version      0.0.17
// @description  调整屏宽，移除buy more，增加bullx跳转，加强dev卖出标记
// @author       yvvw
// @icon         https://gmgn.ai/static/favicon2.ico
// @license      MIT
// @updateURL    https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/gmgn_ai.meta.js
// @downloadURL  https://mirror.ghproxy.com/https://github.com/yvvw/browser-scripts/releases/download/latest/gmgn_ai.user.js
// @match        https://gmgn.ai/*
// @grant        GM_openInTab
// @noframes
// ==/UserScript==

import { HTMLUtils, Logger, NavigatorUtil } from './util'

const logger = Logger.new('Better GMGN.ai')
const pendingClose = new Set<Function>()

window.onload = function main() {
  let previous = ''
  HTMLUtils.observe(
    document.body,
    async () => {
      if (location.href === previous) return
      previous = location.href

      if (pendingClose.size > 0) {
        pendingClose.forEach((close) => close())
        pendingClose.clear()
      }

      const parts = location.pathname.split('/').filter((it) => it !== '')
      if (parts.includes('follow')) {
        await removeBuyMoreActivities()
      } else if (parts.includes('token')) {
        await adjustRecordSize()
      } else if (parts.includes('meme') || parts.includes('pump')) {
        await updateExternalLink()
        await markSellAll()
      }
    },
    { waiting: true, throttle: 500 }
  )
}

async function removeBuyMoreActivities() {
  const activityBtnEl = await HTMLUtils.query(() =>
    HTMLUtils.getFirstElementByXPath<HTMLButtonElement>('//button[text()="Activity"]')
  )
  if (activityBtnEl.getAttribute('tabindex') !== '0') {
    return
  }
  const container = await HTMLUtils.query(() => document.getElementById('gmgnCalls'))
  const removeBuyMore = () => {
    for (const childEl of container.children) {
      const buyMoreEl = childEl.querySelector('div[title="Buy More"]')
      if (buyMoreEl === null) {
        continue
      }
      container.removeChild(childEl)
    }
  }
  pendingClose.add(HTMLUtils.observe(container, removeBuyMore, { throttle: 500 }))
}

async function adjustRecordSize() {
  await HTMLUtils.query(() => document.getElementById('tokenCenter'))
  const tabEl = document.getElementById('leftTabs')
  if (tabEl === null) {
    throw new Error('查询不到leftTabs，需要升级代码')
  }
  const parentEl = tabEl.parentElement as HTMLDivElement
  const sibEl = tabEl.previousElementSibling as HTMLDivElement
  if (parentEl.clientWidth === sibEl.clientWidth) {
    tabEl.style.removeProperty('width')
  } else {
    tabEl.style.setProperty('width', '80%')
  }
  const disconnect = HTMLUtils.observe(parentEl, () => {
    if (parentEl.clientWidth === sibEl.clientWidth) {
      tabEl.style.removeProperty('width')
    } else {
      tabEl.style.setProperty('width', '80%')
    }
  })
  pendingClose.add(disconnect)
}

async function markSellAll() {
  const table = await HTMLUtils.query(() =>
    document.querySelector<HTMLTableElement>('.g-table-tbody')
  )
  const mark = (rowEl: HTMLDivElement) => {
    const sellAllEl = rowEl.lastElementChild?.previousElementSibling?.firstElementChild
      ?.lastElementChild as HTMLDivElement
    if (sellAllEl && sellAllEl.innerText === 'Sell All') {
      rowEl.style.setProperty('--card-color', 'var(--chakra-colors-red-900)')
      rowEl.style.setProperty('--table-hover-color', 'var(--chakra-colors-red-800)')
    } else {
      rowEl.style.removeProperty('--card-color')
      rowEl.style.removeProperty('--table-hover-color')
    }
  }
  pendingClose.add(
    HTMLUtils.observe(
      table,
      () => {
        for (const row of table.children) {
          mark(row as HTMLDivElement)
        }
      },
      { throttle: 500 }
    )
  )
}

async function updateExternalLink() {
  const table = await HTMLUtils.query(() =>
    document.querySelector<HTMLTableElement>('.g-table-tbody')
  )
  const addLink = (rowEl: HTMLDivElement) => {
    const linkEL = rowEl.querySelector<HTMLAnchorElement>('a')
    if (linkEL === null) {
      logger.error('行结构更改')
      return
    }

    const [path, search] = linkEL.href.split('?')
    const query = NavigatorUtil.parseQuery(search)
    if (!('symbol' in query)) {
      logger.error('未发现symbol')
      return
    }
    const symbol = decodeURIComponent(query.symbol)

    const divEl = rowEl.querySelector(`div[title="${symbol}"]`)
    if (divEl === null) {
      logger.error('未发现div元素')
      return
    }
    const divChildEl = divEl.firstElementChild as HTMLDivElement
    if (divChildEl === null) {
      logger.error('未发现div子元素')
      return
    }

    // 调大图标尺寸
    for (let i = 2; i < divChildEl.children.length; i++) {
      const childEl = divChildEl.children.item(i) as HTMLElement
      const svgEls = childEl.querySelectorAll('svg')
      for (const svgEl of svgEls) {
        svgEl.setAttribute('width', '20')
        svgEl.setAttribute('height', '20')
      }
    }

    if (rowEl.dataset['modified'] === '1') {
      updateBullXEl(rowEl.querySelector('a[data-bullx]') as HTMLAnchorElement, path)
    } else {
      const bullXEl = createBullXEl(path)
      divChildEl.appendChild(bullXEl)
    }

    rowEl.dataset['modified'] = '1'
  }
  for (const row of table.children) {
    addLink(row as HTMLDivElement)
  }
  pendingClose.add(
    HTMLUtils.observe(
      table,
      () => {
        for (const row of table.children) {
          addLink(row as HTMLDivElement)
        }
      },
      { throttle: 500 }
    )
  )
}

const bullxIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 40 32" fill="none"><mask maskUnits="userSpaceOnUse" x="0" y="0" width="40" height="32" style="mask-type: luminance;"><path d="M39.2941 0.234375H0.705872V31.7638H39.2941V0.234375Z" fill="white"></path></mask><g mask="url(#mask0_7602_85485)"><path d="M22.957 16.4636L22.7249 18.0189L19.9977 16.414L17.2706 18.0189L17.0385 16.4636L19.9977 14.6953L22.957 16.4636Z" fill="#459C6E"></path><path d="M22.7137 24.9862L19.9983 25.9025L17.2829 24.9862L18.0823 23.4922L19.9983 24.2742L21.9144 23.4922L22.7137 24.9862Z" fill="#58C88D"></path><path d="M19.9986 14.6924L22.9579 16.4637L29.7934 11.5643L28.4151 10.041C26.6548 11.6255 24.2715 12.5593 21.897 12.6235L19.9986 11.4533L18.1002 12.6235C15.7257 12.5593 13.3424 11.6255 11.5821 10.041L10.2039 11.5643L17.0393 16.4637L19.9986 14.6924Z" fill="#459C6E"></path><path d="M28.4137 10.0416C26.6505 11.6291 24.2701 12.557 21.8956 12.6241L19.9972 11.4569L18.0988 12.6241C15.7243 12.557 13.344 11.6291 11.5807 10.0416C12.4624 9.06699 13.3763 8.05739 14.2579 7.08276L16.8204 6.27734L19.9972 8.51843L23.1739 6.27734L25.7365 7.08276C26.6181 8.05739 27.5321 9.06699 28.4137 10.0416Z" fill="#58C88D"></path><path d="M22.7262 18.021L21.9151 23.4922L19.999 24.2743L18.083 23.4922L17.2719 18.021L19.999 16.416L22.7262 18.021Z" fill="#459C6E"></path><path d="M24.8212 28.9704L22.8199 31.1764L19.9987 30.3098L17.1776 31.1764L15.1763 28.9704L17.2834 24.9844L19.9987 25.9006L22.7141 24.9844L24.8212 28.9704Z" fill="#295C41"></path><path d="M22.8205 31.1752L22.2974 31.7618H17.7012L17.1782 31.1752L19.9993 30.3086L22.8205 31.1752Z" fill="#58C88D"></path><path d="M15.7255 17.287L11.5966 14.8066L10.759 17.1177L13.4039 20.4064L14.7233 26.6276L16.5336 23.2894L15.7255 17.287Z" fill="#459C6E"></path><path d="M10.7603 17.1191L10.055 19.0597L14.7246 26.629L13.4051 20.4078L10.7603 17.1191Z" fill="#295C41"></path><path d="M24.2749 17.287L28.4038 14.8066L29.2413 17.1177L26.5965 20.4064L25.277 26.6276L23.4667 23.2894L24.2749 17.287Z" fill="#459C6E"></path><path d="M29.2417 17.1191L29.947 19.0597L25.2774 26.629L26.5969 20.4078L29.2417 17.1191Z" fill="#295C41"></path><path d="M3.08237 7.51489C3.15505 5.13085 7.60583 0.234375 7.60583 0.234375C5.67261 2.28868 3.47774 3.89652 1.86139 6.21635C1.41369 6.85833 1.1317 7.66661 1.27415 8.42237C1.54452 9.84638 2.75387 10.8181 4.76559 11.0049C5.81214 11.1012 8.91986 10.9815 8.91986 10.9815L10.5682 9.16063C8.71637 9.28906 3.02133 9.5108 3.08237 7.51489Z" fill="#295C41"></path><path d="M6.5367 6.59569C5.79538 6.22802 5.26917 5.45475 5.66747 4.17373C6.1326 2.67094 6.69369 1.57375 7.60649 0.234375C7.60649 0.234375 3.15571 5.13085 3.08304 7.51489C3.02199 9.5108 8.71703 9.28906 10.5718 9.16355L12.4847 7.05089C9.9351 7.05089 8.29839 7.47405 6.5367 6.59569Z" fill="#58C88D"></path><path d="M36.9177 7.51489C36.845 5.13085 32.3942 0.234375 32.3942 0.234375C34.3274 2.28868 36.5223 3.89652 38.1386 6.21635C38.5863 6.85833 38.8683 7.66661 38.7259 8.42237C38.4555 9.84638 37.2462 10.8181 35.2344 11.0049C34.1879 11.1012 31.0802 10.9815 31.0802 10.9815L29.4318 9.16063C31.2837 9.28906 36.9787 9.5108 36.9177 7.51489Z" fill="#295C41"></path><path d="M33.4636 6.59569C34.2049 6.22802 34.731 5.45475 34.3328 4.17373C33.8647 2.67094 33.3037 1.57375 32.3908 0.234375C32.3908 0.234375 36.8416 5.13085 36.9143 7.51489C36.9753 9.5108 31.2803 9.28906 29.4256 9.16355L27.5127 7.05089C30.0651 7.05089 31.7018 7.47405 33.4636 6.59569Z" fill="#58C88D"></path></g></svg>'

function createBullXEl(path: string) {
  const href = decodeBullXLink(path)
  const el = document.createElement('a')
  el.setAttribute('href', href)
  el.setAttribute('target', '_blank')
  el.setHTMLUnsafe(bullxIcon)
  el.dataset['bullx'] = 'bullx'
  el.addEventListener('click', (e) => {
    e.preventDefault()
    GM.openInTab(href, { active: true })
  })
  return el
}

function updateBullXEl(el: HTMLAnchorElement, path: string) {
  const href = decodeBullXLink(path)
  el.setAttribute('href', href)
  el.addEventListener('click', (e) => {
    e.preventDefault()
    GM.openInTab(href, { active: true })
  })
}

function decodeBullXLink(path: string) {
  const parts = path.split('/')

  const address = parts.pop()
  if (address === undefined || address.length < 10) {
    throw new Error('链接格式更改')
  }

  let chainId: number
  if (parts.includes('sol')) {
    chainId = 1399811149
  } else if (parts.includes('eth')) {
    chainId = 1
  } else {
    throw new Error('链暂不支持')
  }

  return `https://bullx.io/terminal?chainId=${chainId}&address=${address}`
}
