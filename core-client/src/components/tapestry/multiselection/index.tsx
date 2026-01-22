import styles from './styles.module.css'
import { computeRestrictedScale } from '../../../view-model/utils'
import clsx from 'clsx'
import { idMapToArray } from 'tapestry-core/src/utils'
import { DOM_CONTAINER_CLASS } from '../../../stage/utils'
import { Rectangle } from 'tapestry-core/src/lib/geometry'
import { PropsWithChildren, ReactNode } from 'react'
import { PropsWithStyle } from '../../lib'
import { useTapestryConfig } from '..'
import { useSingleGroupSelection } from '../../lib/hooks/use-single-group-selection'

export interface MultiselectionProps extends PropsWithStyle<PropsWithChildren> {
  bounds: Rectangle
  halo: ReactNode
}

export function Multiselection({ bounds, halo, style, className, children }: MultiselectionProps) {
  const { useStoreData } = useTapestryConfig()
  const { items, interactiveElement, viewport } = useStoreData([
    'items',
    'interactiveElement',
    'viewport',
  ])

  const selectedGroup = useSingleGroupSelection()

  const { top, left, width, height } = bounds

  const borderScale =
    computeRestrictedScale(viewport, idMapToArray(items)) / viewport.transform.scale

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
        ...{
          '--border-scale': borderScale,
        },
        ...style,
      }}
      data-component-type="multiselection"
      className={clsx(DOM_CONTAINER_CLASS, styles.multiselection, className, {
        [styles.group]: !!selectedGroup,
      })}
    >
      {!interactiveElement && halo}
      <div className={styles.dragHandle} data-ui-component="dragArea" />
      {children}
    </div>
  )
}
