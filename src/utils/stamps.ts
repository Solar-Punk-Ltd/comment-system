import { Bee, PostageBatch } from "@ethersphere/bee-js";

export async function getUsableStamp(beeApiUrl: string): Promise<PostageBatch | undefined> {
  const bee = new Bee(beeApiUrl);

  try {
    const batches = await bee.getAllPostageBatch();
    return batches.find(batch => batch.usable);
  } catch (error) {
    console.error("Error while getting usable stamp: ", error);
    return;
  }
}
