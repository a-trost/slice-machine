/* global variable define in server/src/index.js */
declare var appRoot: string;
import { createScreenshotUrl } from '../../../../lib/utils'
import { getPathToScreenshot } from '../../../../lib/queries/screenshot'
import { CustomPaths, GeneratedPaths } from '../../../../lib/models/paths'
import Storybook from '../storybook'

import { getEnv } from '../../../../lib/env'
import mock from '../../../../lib/mock/Slice'
import { insert as insertMockConfig } from '../../../../lib/mock/misc/fs'
import Files from '../../../../lib/utils/files'
import { SliceMockConfig } from '../../../../lib/models/common/MockConfig'
import { Preview } from '../../../../lib/models/common/Component'
import { handleStorybookPreview } from '../common/storybook'

 export default async function handler(req: { body: any }) {
    const { env } = await getEnv()
    const { sliceName, from, model, mockConfig } = req.body

    const pathToSliceAssets = GeneratedPaths(env.cwd).library(from).slice(sliceName).value()
    Files.flushDirectories(pathToSliceAssets)

    const updatedMockConfig = insertMockConfig(env.cwd, {
      key: sliceName,
      prefix: from,
      value: mockConfig
    })

    console.log('[slice/save]: updating slice model')

    const modelPath = CustomPaths(env.cwd)
      .library(from)
      .slice(sliceName)
      .model()
    
    Files.write(modelPath, model)
    
    const hasCustomMocks = Files.exists(
      CustomPaths(env.cwd)
      .library(from)
      .slice(sliceName)
      .mocks()
    )

    if(!hasCustomMocks) {
      console.log('[slice/save]: generating mocks')
    
      const mockedSlice = await mock(sliceName, model, SliceMockConfig.getSliceMockConfig(updatedMockConfig, from, sliceName))
      Files.write(
        GeneratedPaths(env.cwd)
          .library(from)
          .slice(sliceName)
          .mocks(),
        mockedSlice
      )
    }

    // const hasCustomStories = Files.exists(
    //   CustomPaths(env.cwd)
    //   .library(from)
    //   .slice(sliceName)
    //   .stories()
    // )

    console.log('[slice/save]: generating stories')
    Storybook.generateStories(appRoot, env.framework, env.cwd, from, sliceName)
    
    console.log('[slice/save]: generating screenshots previews')
    // since we iterate over variation and execute async code, we need a regular `for` loop to make sure that it's done sequentially and wait for the promise before running the next iteration
    // no, even foreach doesn't do the trick ;)

    let errors: any[] = []
    let warning: string | null = null
    let previewUrls: { [variationId: string]: Preview } = {}

    for(let i = 0; i < model.variations.length; i += 1) {
      const variation = model.variations[i]
      const screenshotArgs = {
        cwd: env.cwd,
        from,
        sliceName,
        variationId: variation.id
      }
      const activeScreenshot = getPathToScreenshot(screenshotArgs)
      
      if(!activeScreenshot) {
        const screenshotUrl = createScreenshotUrl({ storybook: env.userConfig.storybook, libraryName: from, sliceName, variationId: variation.id })
        const pathToFile = GeneratedPaths(env.cwd)
          .library(screenshotArgs.from)
          .slice(screenshotArgs.sliceName)
          .variation(screenshotArgs.variationId)
          .preview()

        const error = await handleStorybookPreview({ screenshotUrl, pathToFile })
        if(error) {
          warning = error
          console.log(`[slice/save][Slice: ${sliceName}][variation: ${variation.id}]: ${error}`)
          previewUrls[variation.id] = {
            isCustomPreview: false,
            hasPreview: false,
          }
        } else {
          previewUrls[variation.id] = {
            isCustomPreview: false,
            hasPreview: true,
            url: `${env.baseUrl}/api/__preview?q=${encodeURIComponent(pathToFile)}&uniq=${Math.random()}`
          }
        }
      } else {
        previewUrls[variation.id] = {
          isCustomPreview: activeScreenshot.isCustom,
          hasPreview: true,
          url: `${env.baseUrl}/api/__preview?q=${encodeURIComponent(activeScreenshot.path)}&uniq=${Math.random()}`
        }
      }
    }

    console.log('[slice/save]: Slice was saved!')
    

    return errors.length ? { err: errors, previewUrls, warning } : { previewUrls, warning }
  }