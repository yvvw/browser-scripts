export async function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

export function observe(exec: (records: MutationRecord[]) => any, target: Element = document.body) {
  let running = false
  const callback: MutationCallback = async (records) => {
    if (running) {
      return
    }
    running = true
    const res = exec(records)
    if (res instanceof Promise) {
      await res
    }
    running = false
  }
  const observer = new MutationObserver(callback)
  observer.observe(target, { childList: true, subtree: true })
  return observer
}

export function parseQuery(search: string): { [key: string]: string } {
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

export async function waitingElement<T extends Element>(
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
