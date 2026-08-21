// scraped this code from vueuse

import { MaybeRefOrGetter, toValue } from "vue"

export type AnyFn = (...args: any[]) => any

export type TimerHandle = ReturnType<typeof setTimeout> | undefined

export type Promisify<T> = Promise<Awaited<T>>

export type FunctionArgs<Args extends any[] = any[], Return = unknown> = (...args: Args) => Return

export interface FunctionWrapperOptions<Args extends any[] = any[], This = any> {
  fn: FunctionArgs<Args, This>
  args: Args
  thisArg: This
}

export type EventFilter<Args extends any[] = any[], This = any, Invoke extends AnyFn = AnyFn> = (
  invoke: Invoke,
  options: FunctionWrapperOptions<Args, This>,
) => ReturnType<Invoke> | Promisify<ReturnType<Invoke>>

const noop = () => {}

export interface DebounceFilterOptions {
  /**
   * The maximum time allowed to be delayed before it's invoked.
   * In milliseconds.
   */
  maxWait?: MaybeRefOrGetter<number>

  /**
   * Whether to reject the last call if it's been cancel.
   *
   * @default false
   */
  rejectOnCancel?: boolean
}

export function debounceFilter(ms: MaybeRefOrGetter<number>, options: DebounceFilterOptions = {}) {
  let timer: TimerHandle
  let maxTimer: TimerHandle
  let lastRejector: AnyFn = noop

  const _clearTimeout = (timer: TimerHandle) => {
    clearTimeout(timer)
    lastRejector()
    lastRejector = noop
  }

  let lastInvoker: () => void

  const filter: EventFilter = (invoke) => {
    const duration = toValue(ms)
    const maxDuration = toValue(options.maxWait)

    if (timer)
      _clearTimeout(timer)

    if (duration <= 0 || (maxDuration !== undefined && maxDuration <= 0)) {
      if (maxTimer) {
        _clearTimeout(maxTimer)
        maxTimer = undefined
      }
      return Promise.resolve(invoke())
    }

    return new Promise((resolve, reject) => {
      lastRejector = options.rejectOnCancel ? reject : resolve
      lastInvoker = invoke
      // Create the maxTimer. Clears the regular timer on invoke
      if (maxDuration && !maxTimer) {
        maxTimer = setTimeout(() => {
          if (timer)
            _clearTimeout(timer)
          maxTimer = undefined
          resolve(lastInvoker())
        }, maxDuration)
      }

      // Create the regular timer. Clears the max timer on invoke
      timer = setTimeout(() => {
        if (maxTimer)
          _clearTimeout(maxTimer)
        maxTimer = undefined
        resolve(invoke())
      }, duration)
    })
  }

  return filter
}

export type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never
export type PromisifyFn<T extends AnyFn> = (...args: ArgumentsType<T>) => Promisify<ReturnType<T>>
export type UseDebounceFnReturn<T extends FunctionArgs> = PromisifyFn<T>

export function createFilterWrapper<T extends AnyFn>(filter: EventFilter, fn: T) {
  function wrapper(this: any, ...args: ArgumentsType<T>) {
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      // make sure it's a promise
      Promise.resolve(filter(() => fn.apply(this, args), { fn, thisArg: this, args }))
        .then(resolve)
        .catch(reject)
    })
  }

  return wrapper
}

export function useDebounceFn<T extends FunctionArgs>(
  fn: T,
  ms: MaybeRefOrGetter<number> = 200,
  options: DebounceFilterOptions = {},
): UseDebounceFnReturn<T> {
  return createFilterWrapper(
    debounceFilter(ms, options),
    fn,
  )
}





// copilot code
// My comment: This feels like just moving the this.locked from whatever check I had beforehand. However, the code inside
//  the lock function seems to have no async elements and runs synchronously. So as long as the scheduler does not arbitrarily
//  preempt the execution in there we should effectively get a proper mutex mechanic. The if check inside the async function to
//  produce either a way or a perform action seems to be okay
export class Mutex {
  private locked = false;
  private waiters: (() => void)[] = [];

  async lock(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true;
      return () => this.unlock();
    }

    return new Promise(resolve => {
      this.waiters.push(() => {
        this.locked = true;
        resolve(() => this.unlock());
      });
    });
  }

  private unlock() {
    const next = this.waiters.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
}





// deferred promise implementation from lea.verou.me/blog/2016/12/...

export type ResolveType<T> = (value: T) => void
export type RejectType = (reason: any) => void
// export type DeferredPromiseType<T> {
//   promise: Promise<T> | null
//   resolve: ResolveType<T> | null
//   reject: RejectType | null
// }


export type DeferredPromiseType<T = void> = Promise<T> & {
  resolve: ResolveType<T>,
  reject: RejectType
}


export function deferedPromise<T = void>(): DeferredPromiseType<T> {

  let res!: ResolveType<T>;
  let rej!: RejectType;

  // let deferred: DeferredPromiseType<T> = {
  //   promise: null,
  //   resolve: null,
  //   reject: null
  // }

  // the constructor callback is called synchronously so the use of the ! in the res and rej definition is fine
  let promise = new Promise<T>((resolve, reject) => {
    res = resolve;
    rej = reject;
  }) as DeferredPromiseType<T>;

  // deferred.promise = new Promise<T>((resolve, reject) => {
  //   deferred.resolve = resolve;
  //   deferred.reject = reject;
  // })
  promise.resolve = res;
  promise.reject = rej;
  return promise;

  // return deferred;
}


export function getFontFromElement(element: Element): string {
  const style = getComputedStyle(element);
  return style.font;
} 


export function measureText(text: string, {
  fontSize = 14,
  fontFamily = 'Roboto, sans-serif',
  fontWeight = '400',
  fontStyle = 'normal',
  fontVariant = 'normal'
} = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (ctx == null) throw Error('Invalid Browser api usage')
  
  ctx.font = `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${fontFamily}`;

  const metrics = ctx.measureText(text);

  return {
    width: metrics.width,
    actualLeft: metrics.actualBoundingBoxLeft,
    actualRight: metrics.actualBoundingBoxRight,
    height:
      metrics.actualBoundingBoxAscent +
      metrics.actualBoundingBoxDescent
  };
}
