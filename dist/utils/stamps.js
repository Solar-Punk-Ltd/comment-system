import { BeeDebug } from '@ethersphere/bee-js';
export async function getUsableStamp(beeDebugApiUrl) {
    const bee = new BeeDebug(beeDebugApiUrl);
    const batches = await bee.getAllPostageBatch();
    return batches.find(batch => batch.usable);
}
