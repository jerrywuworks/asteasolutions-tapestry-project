import { RefObject } from 'react'
import { useAsync } from '../../lib/hooks/use-async'
import { createTapestryStage, TapestryStage } from '../../../stage'
import { TapestryLifecycleController } from '../../../stage/controller'
import { Application } from 'pixi.js'
import { usePropRef } from '../../lib/hooks/use-prop-ref'
import { TapestryViewModel } from '../../../view-model'
import { GestureDetectorOptions } from '../../../stage/gesture-detector'

type PixiApps<S extends string> =
  | [{ name: 'tapestry'; app: Application }]
  | [{ name: 'tapestry'; app: Application }, { name: S; app: Application }]

export function useStageInit<
  T extends TapestryViewModel,
  M extends Exclude<string, 'default'>,
  S extends string,
>(
  sceneRef: RefObject<HTMLDivElement | null>,
  config: {
    createPixiApps: () => Promise<PixiApps<S>>
    lifecycleController: (stage: TapestryStage<S>) => TapestryLifecycleController<T, M>
    gestureDetectorOptions: GestureDetectorOptions
  },
) {
  const configRef = usePropRef(config)

  useAsync(
    async (_abortCtrl, cleanUp) => {
      const scene = sceneRef.current!
      const { gestureDetectorOptions, lifecycleController, createPixiApps } = configRef.current

      let cancelled = false as boolean
      cleanUp(() => {
        cancelled = true
      })

      const pixiApps = await createPixiApps()

      if (cancelled) {
        pixiApps.forEach(({ app }) => app.destroy(true, true))
        return
      }

      const stage = createTapestryStage<S>(
        scene,
        pixiApps.reduce(
          (acc, { app, name }) => ({ ...acc, [name]: app }),
          {} as Record<'tapestry' | S, Application>,
        ),
        gestureDetectorOptions,
      )

      const controller = lifecycleController(stage)

      controller.init()

      cleanUp(() => {
        controller.dispose()
        pixiApps.forEach(({ app }) => {
          // Make sure we clean up the pixi apps properly. Otherwise navigating to the dashboard and then
          // to another tapestry leads to loss of WebGL context and Pixi doesn't render anything.
          app.stop()
          app.ticker.stop()
          app.stage.removeChildren().forEach((c) => c.destroy({ children: true }))
          app.destroy(true, true)
        })
      })
    },
    [sceneRef, configRef],
  )
}
