#!/usr/bin/env node
/**
 * Capture the deployed static app at CAPTURE_URL into CAPTURE_DIR.
 *
 * Exit codes:
 *   0  both screenshots were written and checked
 *   1  script defect or rendering defect (missing UI, page errors, bad output)
 *  75  temporary navigation / browser infrastructure failure
 */
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const STARTED = Date.now()

function elapsed() {
  return Date.now() - STARTED
}

function timing(label, since) {
  console.log(`[timing] ${label}: ${Date.now() - since} ms (total ${elapsed()} ms)`)
}

const TRANSIENT = 75
const DEFECT = 1

function exitWith(code, message) {
  if (message) console.error(`[capture] ${message}`)
  process.exit(code)
}

function transient(message, cause) {
  const error = new Error(message, cause ? { cause } : undefined)
  error.exitCode = TRANSIENT
  return error
}

function defect(message, cause) {
  const error = new Error(message, cause ? { cause } : undefined)
  error.exitCode = DEFECT
  return error
}

function parseArgs() {
  const url = (process.env.CAPTURE_URL || '').trim()
  const directory = (process.env.CAPTURE_DIR || '').trim()
  if (!url) throw defect('CAPTURE_URL is required')
  if (!directory) throw defect('CAPTURE_DIR is required')

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw defect(`CAPTURE_URL is not a valid URL: ${url}`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw defect(`CAPTURE_URL must use http or https, got ${parsed.protocol}`)
  }

  return { url, directory: resolve(directory), origin: parsed.origin }
}

function pngSize(file) {
  const bytes = readFileSync(file)
  if (bytes.length < 24 || bytes.subarray(1, 4).toString('latin1') !== 'PNG') {
    throw defect(`Screenshot is not a PNG: ${file}`)
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length }
}

function verifyScreenshot(file, expectedWidth, expectedHeight) {
  let stat
  try {
    stat = statSync(file)
  } catch (error) {
    throw defect(`Screenshot was not written: ${file}`, error)
  }
  if (stat.size < 20_000) {
    throw defect(`Screenshot looks blank or incomplete (${stat.size} bytes): ${file}`)
  }
  const png = pngSize(file)
  if (png.width !== expectedWidth || png.height !== expectedHeight) {
    throw defect(`Screenshot has unexpected size ${png.width}x${png.height}: ${file}`)
  }
  if (png.bytes < 20_000) {
    throw defect(`Screenshot PNG payload is unexpectedly small (${png.bytes} bytes): ${file}`)
  }
  return png
}

function installFontAndImageChecks(page) {
  page.on('pageerror', (error) => {
    page.__captureFailures.push(`page error: ${error.message}`)
  })
  page.on('response', (response) => {
    let requestOrigin
    try {
      requestOrigin = new URL(response.url()).origin
    } catch {
      return
    }
    if (requestOrigin !== page.__captureOrigin) return
    if (response.status() >= 400) {
      page.__captureFailures.push(`HTTP ${response.status()}: ${response.url()}`)
    }
  })
}

async function waitForRenderedContent(page, label) {
  const started = Date.now()
  try {
    await page.waitForSelector('#app', { state: 'visible', timeout: 120_000 })
    await page.waitForSelector('#scene canvas', { state: 'attached', timeout: 180_000 })
  } catch (error) {
    throw defect(`${label}: app shell or WebGL canvas never rendered`, error)
  }

  try {
    await page.waitForFunction(() => {
      const loading = document.getElementById('loadingScreen')
      if (!loading || loading.classList.contains('out')) return true
      return /FAILED TO BOOT/i.test(loading.textContent || '')
    }, null, { timeout: 60_000 })
  } catch (error) {
    throw defect(`${label}: loading screen never cleared`, error)
  }

  const bootFailure = await page.evaluate(() => {
    const loading = document.getElementById('loadingScreen')
    return loading && /FAILED TO BOOT/i.test(loading.textContent || '')
      ? loading.textContent.replace(/\s+/g, ' ').trim()
      : ''
  })
  if (bootFailure) throw defect(`${label}: app reported a boot failure: ${bootFailure}`)

  await page.evaluate(async () => {
    try {
      await document.fonts?.ready
    } catch {}
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  }).catch(() => {})

  const shellVisible = await page.evaluate(() => {
    const splash = document.getElementById('splash')
    const game = document.getElementById('game')
    const visible = (element) => Boolean(element) && !element.classList.contains('hidden') && element.getBoundingClientRect().width > 0
    return visible(splash) || visible(game)
  })
  if (!shellVisible) throw defect(`${label}: neither the title screen nor the game is visible`)
  timing(`${label} rendered-content wait`, started)
}

async function startGameIfPossible(page, label) {
  const started = Date.now()
  const play = page.locator('#playBtn')
  const visible = await play.isVisible().catch(() => false)
  if (!visible) {
    console.log(`[capture] ${label}: no PLAY button, keeping title screen`)
    return
  }
  try {
    await play.click({ timeout: 10_000, noWaitAfter: true })
    await page.waitForSelector('#game:not(.hidden)', { state: 'visible', timeout: 15_000 })
    await page.waitForFunction(() => {
      const splash = document.getElementById('splash')
      return !splash || splash.classList.contains('out') || getComputedStyle(splash).display === 'none'
    }, null, { timeout: 15_000 })
  } catch (error) {
    throw defect(`${label}: clicking PLAY did not open the game`, error)
  }
  timing(`${label} start interaction`, started)
}

async function settle(page) {
  await page.waitForTimeout(1_500)
}

async function captureView(browser, url, origin, output, name, viewport, mobile) {
  const label = `${name} ${viewport.width}x${viewport.height}`
  const pageStarted = Date.now()
  let page
  try {
    page = await browser.newPage({
      viewport,
      screen: viewport,
      deviceScaleFactor: 1,
      isMobile: mobile,
      hasTouch: mobile,
      locale: 'en-US',
      colorScheme: 'dark',
    })
  } catch (error) {
    if (!browser.isConnected()) throw transient(`${label}: browser disconnected before opening a page`, error)
    throw transient(`${label}: could not open a browser page`, error)
  }
  page.setDefaultTimeout(60_000)
  page.__captureOrigin = origin
  page.__captureFailures = []
  installFontAndImageChecks(page)

  try {
    const navStarted = Date.now()
    let response
    try {
      response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    } catch (error) {
      if (!browser.isConnected()) throw transient(`${label}: browser disconnected during navigation`, error)
      throw transient(`${label}: navigation to ${url} failed: ${error.message}`, error)
    }
    timing(`${label} navigation`, navStarted)

    const status = response?.status() ?? 0
    if (!response) throw transient(`${label}: no HTTP response for ${url}`)
    if (!response.ok()) {
      const retryable = status === 408 || status === 429 || status >= 500
      throw (retryable ? transient : defect)(`${label}: HTTP ${status} for ${url}`)
    }
    if (response.url() !== url && !response.url().startsWith(url.replace(/\/$/, '') + '/')) {
      throw defect(`${label}: URL changed unexpectedly to ${response.url()}`)
    }

    await waitForRenderedContent(page, label)
    await startGameIfPossible(page, label)
    await settle(page)

    if (page.__captureFailures.length) {
      throw defect(`${label}: page reported problems: ${page.__captureFailures.join('; ')}`)
    }
    if (!browser.isConnected()) throw transient(`${label}: browser disconnected before screenshot`)

    const shotStarted = Date.now()
    const file = join(output, `final-${name}.png`)
    try {
      await page.screenshot({
        path: file,
        type: 'png',
        scale: 'css',
        timeout: 300_000,
        animations: 'disabled',
      })
    } catch (error) {
      if (!browser.isConnected()) throw transient(`${label}: browser disconnected during screenshot`, error)
      throw defect(`${label}: screenshot failed: ${error.message}`, error)
    }
    timing(`${label} screenshot`, shotStarted)
    const png = verifyScreenshot(file, viewport.width, viewport.height)
    console.log(`[capture] wrote ${file} (${png.width}x${png.height}, ${png.bytes} bytes)`)
    timing(`${label} total`, pageStarted)
  } finally {
    if (page) {
      await page.close().catch(() => {})
    }
  }
}

async function main() {
  let args
  try {
    args = parseArgs()
  } catch (error) {
    exitWith(error.exitCode || DEFECT, error.message)
  }

  try {
    mkdirSync(args.directory, { recursive: true })
    writeFileSync(join(args.directory, 'capture-url.txt'), `${args.url}\n`)
  } catch (error) {
    exitWith(DEFECT, `CAPTURE_DIR is not writable: ${args.directory}: ${error.message}`)
  }

  const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const relativeOutput = relative(projectRoot, args.directory)
  if (relativeOutput && !relativeOutput.startsWith('..') && !isAbsolute(relativeOutput)) {
    console.warn(`[capture] warning: CAPTURE_DIR is inside the project (${args.directory}); evidence should live outside source`)
  }

  const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
  let chromium
  try {
    const require = createRequire(join(runtime, 'package.json'))
    ;({ chromium } = require('playwright'))
  } catch (error) {
    exitWith(DEFECT, `Playwright is not available at ${runtime}: ${error.message}`)
  }

  let config
  try {
    config = JSON.parse(readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))
  } catch (error) {
    exitWith(DEFECT, `Playwright config is unavailable: ${error.message}`)
  }
  if (process.platform === 'linux') {
    try {
      process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()
    } catch {
      // Headless environments may not need DISPLAY; launch will report the real error.
    }
  }

  const launchStarted = Date.now()
  let browser
  try {
    browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 45_000 })
  } catch (error) {
    exitWith(TRANSIENT, `could not launch Chromium: ${error.message}`)
  }
  timing('browser launch', launchStarted)

  let failure
  try {
    await captureView(browser, args.url, args.origin, args.directory, 'desktop', { width: 1440, height: 900 }, false)
    await captureView(browser, args.url, args.origin, args.directory, 'mobile', { width: 390, height: 844 }, true)
  } catch (error) {
    failure = error
  } finally {
    const closeStarted = Date.now()
    await browser.close().catch((error) => {
      console.error(`[capture] browser close failed: ${error.message}`)
    })
    timing('browser close', closeStarted)
  }

  if (failure) {
    exitWith(failure.exitCode || DEFECT, failure.message)
  }

  const files = ['final-desktop.png', 'final-mobile.png'].map((file) => join(args.directory, file))
  writeFileSync(join(args.directory, 'capture-summary.json'), `${JSON.stringify({
    url: args.url,
    capturedAt: new Date().toISOString(),
    files,
  }, null, 2)}\n`)
  console.log(`[capture] success: ${files.join(', ')}`)
  timing('capture total', STARTED)
}

main().catch((error) => {
  exitWith(error.exitCode || DEFECT, error.stack || error.message)
})
