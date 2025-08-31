import { Bee, PostageBatch } from "@ethersphere/bee-js";

export async function getUsableStamp(beeApiUrl: string): Promise<PostageBatch | undefined> {
  const bee = new Bee(beeApiUrl);

  try {
    const batches = await bee.getPostageBatches();
    return batches.find(batch => batch.usable);
  } catch (err: any) {
    console.error("Error while getting usable stamp: ", err.message || err);
    return;
  }
}
