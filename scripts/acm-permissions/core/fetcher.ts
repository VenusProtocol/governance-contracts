import { isLegacyAcm } from "../config";
import { Network, PermissionEvent } from "../types";
import { HashTable, TOPICS, decodeLog } from "./decoder";
import { withRetry } from "./retry";

export async function scanRange(opts: {
  provider: { getLogs(f: any): Promise<any[]>; getBlockNumber(): Promise<number> };
  network: Network;
  acmAddress: string;
  table: HashTable | null;
  fromBlock: number;
  toBlock?: number;
  chunkSize: number;
  onChunk: (events: PermissionEvent[], chunkEndBlock: number) => void;
  log?: (msg: string) => void;
}): Promise<{ fromBlock: number; toBlock: number; totalEvents: number; upToDate: boolean }> {
  const { provider, network, acmAddress, table, chunkSize, onChunk, log = () => undefined } = opts;
  const toBlock = opts.toBlock ?? (await withRetry(() => provider.getBlockNumber(), `${network} getBlockNumber`));
  if (opts.fromBlock > toBlock) return { fromBlock: opts.fromBlock, toBlock, totalEvents: 0, upToDate: true };
  const t = isLegacyAcm(network) ? TOPICS.legacy : TOPICS.modern;
  let totalEvents = 0;
  for (let start = opts.fromBlock; start <= toBlock; ) {
    const end = Math.min(start + chunkSize - 1, toBlock);
    const logs = await withRetry(
      () => provider.getLogs({ address: acmAddress, topics: [[t.granted, t.revoked]], fromBlock: start, toBlock: end }),
      `${network} getLogs ${start}-${end}`,
    );
    const events: PermissionEvent[] = logs.map((l: any) => decodeLog(l, network, acmAddress, table));
    totalEvents += events.length;
    onChunk(events, end);
    log(`[${network}] blocks ${start}-${end}: ${events.length} events`);
    start = end + 1;
  }
  return { fromBlock: opts.fromBlock, toBlock, totalEvents, upToDate: false };
}
