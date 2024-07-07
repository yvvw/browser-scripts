export async function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

export class HTMLUtils {
  static async waitingElement<T extends Element>(
    getElement: () => T | null,
    timeout = 5000,
    interval = 500
  ) {
    if (typeof getElement !== 'function') {
      throw new Error('first argument must be a function')
    }
    let time = 0

    while (true) {
      const el = getElement()
      if (el !== null) {
        return el
      }
      if (time > timeout) {
        throw new Error('timeout')
      }
      await delay(interval)
      time += interval
    }
  }

  static observe(
    exec: (records: MutationRecord[]) => any,
    target: Element = document.body,
    throttle = 300
  ) {
    let running = false
    let timerId: ReturnType<typeof setTimeout>
    let lastInvokeAt = 0
    const callback: MutationCallback = (records) => {
      if (running) {
        return
      }
      const now = Date.now()
      if (now - lastInvokeAt < throttle) {
        clearTimeout(timerId)
      }
      lastInvokeAt = now
      timerId = setTimeout(async () => {
        running = true
        const res = exec(records)
        if (res instanceof Promise) {
          await res
        }
        running = false
      }, throttle)
    }
    const observer = new MutationObserver(callback)
    observer.observe(target, { childList: true, subtree: true })
    return observer
  }
}

export class NavigatorUtil {
  static parseQuery(search: string): { [key: string]: string } {
    return search
      .replace('?', '')
      .split('&')
      .filter((it) => it !== '')
      .map((it) => it.split('='))
      .reduce<{ [key: string]: string }>((res, it) => {
        res[it[0]] = it[1]
        return res
      }, {})
  }
}
