/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { URL } from 'url'
import { config } from '../../config.js'
import { createJWT } from '../../auth/tokens.js'
import { REFRESH_TOKEN_COOKIE_NAME } from '../../auth/index.js'
import { ScreenshotConfig, takeScreenshot } from './webpage.js'
import { Size } from 'tapestry-core/src/data-format/schemas/common.js'
import { ThumbnailRenditionOutput } from './index.js'
import { generateThumbnail } from './image.js'

export async function takeTapestryScreenshot(
  tapestryPath: string,
  userId: string,
  options: ScreenshotConfig,
) {
  return takeScreenshot(`${config.server.viewerUrl}${tapestryPath}`, {
    setupContext: (context) =>
      context.setCookie({
        domain: new URL(config.server.externalUrl).host,
        name: REFRESH_TOKEN_COOKIE_NAME,
        value: createJWT({ userId }, '10m'),
        expires: -1, // Session cookie
        httpOnly: true,
        secure: true,
      }),
    ...options,
  })
}

export async function generateTapestryItemThumbnail(
  tapestryId: string,
  itemId: string,
  ownerId: string,
  { width, height }: Size,
): Promise<ThumbnailRenditionOutput | undefined> {
  const tapestryPath = `/t/${tapestryId}?focus=${itemId}&deopt=1`
  const elementSelector = `[data-model-id="${itemId}"]`
  const screenshot = await takeTapestryScreenshot(tapestryPath, ownerId, {
    // Deactivate the tapestry item first, so that its border disappears
    interact: async (page) => {
      // Hide everything else around it
      await page.evaluate((elementSelector) => {
        // @ts-expect-error This will be executed in a browser context
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const global = window
        // Deactivate the focused element
        global.postMessage({ type: 'deactivate' })
        global.document.documentElement.style.background = 'transparent'
        global.document.body.style.background = 'transparent'
        global.document
          .querySelectorAll(`.pixi-container, [data-model-id]:not(${elementSelector})`)
          .forEach((elem: { style: { display: string } }) => {
            elem.style.display = 'none'
          })
      }, elementSelector)
    },
    elementSelector,
    // The browser window should be larger than the required element size in order to accommodate
    // for the tapestry controls around it.
    width: width + 100,
    height: height + 300,
    omitBackground: true,
    type: 'png',
  })
  return generateThumbnail(Buffer.from(screenshot), { maxDim: Math.max(width, height) })
}
