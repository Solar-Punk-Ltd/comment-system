import { Bee } from '@ethersphere/bee-js';
export async function getUsableStamp(beeDebugApiUrl) {
    const bee = new Bee(beeDebugApiUrl);
    const batches = await bee.getAllPostageBatch();
    return batches.find(batch => batch.usable);
}
