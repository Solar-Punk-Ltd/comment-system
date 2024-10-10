import { Bee, PostageBatch } from '@ethersphere/bee-js'

export async function getUsableStamp(beeDebugApiUrl: string): Promise<PostageBatch | undefined> {
  const bee = new Bee(beeDebugApiUrl)

  const batches = await bee.getAllPostageBatch()

  return batches.find(batch => batch.usable)
}
