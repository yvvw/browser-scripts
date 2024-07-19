export async function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

export class HTMLUtils {
  static async waitingElement<EL extends Element>(
    getElement: () => EL | null,
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

  static getFirstElementByXPath<EL extends Element>(
    xpath: string,
    context: Node = document
  ): EL | null {
    return document.evaluate(xpath, context, null, XPathResult.ANY_TYPE, null).iterateNext() as EL
  }

  static getElementsByXPath<EL extends Element>(xpath: string, context: Node = document): EL[] {
    const iterator = document.evaluate(xpath, context, null, XPathResult.ANY_TYPE, null)
    const result: EL[] = []
    let item: EL | null
    while ((item = iterator.iterateNext() as EL)) {
      result.push(item)
    }
    return result
  }

  static simpleObserve(
    node: Node = document.body,
    callback: (
      mutations: MutationRecord[],
      observer: MutationObserver
    ) => boolean | void | Promise<boolean | void>,
    throttle = 300
  ) {
    return HTMLUtils.observe(node, callback, { waiting: true, throttle })
  }

  static observe(
    node: Node,
    callback: (
      mutations: MutationRecord[],
      observer: MutationObserver
    ) => boolean | void | Promise<boolean | void>,
    options?: MutationObserverInit & { waiting?: boolean; throttle?: number }
  ): () => void {
    let running = false
    let timer: ReturnType<typeof setTimeout>
    let lastCallAt = 0

    const observer = new MutationObserver(async (mutations, ob) => {
      const exec = async () => {
        const result = callback(mutations, ob)
        const ok = result instanceof Promise ? await result : result
        if (ok) disconnect()
      }
      const throttle = (callback: () => void, interval: number) => {
        const now = Date.now()
        if (now - lastCallAt < interval) clearTimeout(timer)
        lastCallAt = now
        timer = setTimeout(callback, interval)
      }

      if (!options?.waiting) {
        if (options?.throttle === undefined) {
          await exec()
        } else {
          throttle(exec, options.throttle)
        }
      } else {
        if (options?.throttle === undefined) {
          if (running) return
          running = true
          await exec()
          running = false
        } else {
          if (running) return
          throttle(async () => {
            running = true
            await exec()
            running = false
          }, options.throttle)
        }
      }
    })
    observer.observe(node, { childList: true, subtree: true, ...options })

    const disconnect = () => observer.disconnect()
    return disconnect
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

export class GM {
  static addElement(...args: Parameters<typeof GM_addElement>) {
    return GM_addElement(...args)
  }

  static addStyle(...args: Parameters<typeof GM_addStyle>) {
    return GM_addStyle(...args)
  }
}
