import Logo from 'tapestry-core-client/src/assets/icons/logo.svg?react'
import { DropArea } from 'tapestry-core-client/src/components/lib/drop-area'
import { FilePicker } from 'tapestry-core-client/src/components/lib/file-picker'
import { SvgIcon } from 'tapestry-core-client/src/components/lib/svg-icon'
import { Text } from 'tapestry-core-client/src/components/lib/text'
import { TYPE } from 'tapestry-core/src/data-format/export'
import styles from './styles.module.css'

interface TapestryImportProps {
  onImport: (file: File) => unknown
}

export function TapestryImport({ onImport }: TapestryImportProps) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <SvgIcon Icon={Logo} width={150} className={styles.logo} />
        <Text className={styles.title}>Tapestry Viewer</Text>
      </div>
      <FilePicker accept={TYPE} onChange={onImport}>
        <DropArea
          alwaysVisible
          allowDrop={(items) => items.some((i) => i.type === TYPE)}
          onDrop={(e) => onImport(e.dataTransfer.files[0])}
          title="Load Tapestry"
          subtitle="Drop a Tapestry ZIP here"
        />
      </FilePicker>
    </div>
  )
}
