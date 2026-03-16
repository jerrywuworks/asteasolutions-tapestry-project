import z from 'zod/v4'
import { ExportV6Schema } from '../v6'
import { ItemSchema } from '../../schemas/item'

export const ExportV7Schema = z.object({
  ...ExportV6Schema.shape,
  version: z.literal(7),
  items: z.array(ItemSchema).nullish(),
})

export type ExportV7 = z.infer<typeof ExportV7Schema>
