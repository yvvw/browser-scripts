export async function delay(time: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, time))
}

export async function getNotFalsyValue<R>(
  callback: () => R | null | undefined | Promise<R | null | undefined>,
  option?: { times?: number; interval?: number }
): Promise<NonNullable<R>> {
  let times = option?.times || 20
  let interval = option?.interval || 500

  while (true) {
    times--
    const r = callback()
    const v = r instanceof Promise ? await r : r
    if (v) return v
    if (times === 0) throw new Error(`can't get value: ${callback.toString()}`)
    await delay(interval)
  }
}

export class HTMLUtils {
  static async query<N extends Node>(
    queryElement: () => N | null,
    option?: { times: number; interval: number }
  ) {
    return getNotFalsyValue<N>(queryElement, { interval: 500, ...option })
  }

  static evaluate(xpath: string, context: Node = document) {
    return document.evaluate(xpath, context, null, XPathResult.ANY_TYPE, null)
  }

  static getFirstElementByXPath<E extends Element>(xpath: string, context?: Node): E | null {
    return this.evaluate(xpath, context).iterateNext() as E
  }

  static getElementsByXPath<E extends Element>(xpath: string, context?: Node): E[] {
    const res = this.evaluate(xpath, context)
    const r: E[] = []
    let i: E | null
    while ((i = res.iterateNext() as E)) r.push(i)
    return r
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

  static GM_openInTab(...args: Parameters<typeof GM_openInTab>) {
    return GM_openInTab(...args)
  }
}

export class Logger {
  static #console = console

  static new(ns: string): Logger {
    return new this(ns)
  }

  constructor(private ns: string) {}

  log(...args: Parameters<Console['log']>) {
    Logger.#console.log.apply(Logger.#console, this.#inject(args))
  }

  warn(...args: Parameters<Console['warn']>) {
    Logger.#console.warn.apply(Logger.#console, this.#inject(args))
  }

  error(...args: Parameters<Console['error']>) {
    Logger.#console.error.apply(Logger.#console, this.#inject(args))
  }

  #inject(args: any[]) {
    return [
      `%c${this.ns}%c ${args[0]}`,
      'background: #2a2; color: #fff; padding: 2px 4px; border-radius: 2px;',
      '',
      ...args.slice(1),
    ]
  }
}
