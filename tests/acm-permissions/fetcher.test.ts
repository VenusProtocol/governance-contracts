import { expect } from "chai";
import { ethers } from "ethers";

import { TOPICS } from "../../scripts/acm-permissions/core/decoder";
import { scanRange } from "../../scripts/acm-permissions/core/fetcher";
import { withRetry } from "../../scripts/acm-permissions/core/retry";

const ACM = "0x4788629ABc6cFCA10F9f969efdEAa1cF70c23555";
const log = (blockNumber: number) => ({
  address: ACM,
  blockNumber,
  logIndex: 0,
  transactionHash: "0xt",
  topics: [TOPICS.modern.granted],
  data: ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "string"],
    ["0x939bD8d64c0A9583A7Dcea9933f7b21697ab6396", "0xfD36E2c2a6789Db23113685031d7F16329158384", "pause()"],
  ),
});

describe("fetcher", () => {
  it("chunks ranges, checkpoints each chunk, aggregates events", async () => {
    const calls: [number, number][] = [];
    const checkpoints: number[] = [];
    const provider = {
      getBlockNumber: async () => 250,
      getLogs: async (f: any) => {
        calls.push([f.fromBlock, f.toBlock]);
        return f.fromBlock === 1 ? [log(5)] : [];
      },
    };
    const r = await scanRange({
      provider,
      network: "ethereum",
      acmAddress: ACM,
      table: null,
      fromBlock: 1,
      chunkSize: 100,
      onChunk: (_e, end) => checkpoints.push(end),
    });
    expect(calls).to.deep.equal([
      [1, 100],
      [101, 200],
      [201, 250],
    ]);
    expect(checkpoints).to.deep.equal([100, 200, 250]);
    expect(r).to.include({ totalEvents: 1, upToDate: false, toBlock: 250 });
  });
  it("is a no-op when already at head", async () => {
    const provider = {
      getBlockNumber: async () => 100,
      getLogs: async () => {
        throw new Error("must not be called");
      },
    };
    const r = await scanRange({
      provider,
      network: "ethereum",
      acmAddress: ACM,
      table: null,
      fromBlock: 101,
      chunkSize: 100,
      onChunk: () => {
        throw new Error("no chunk expected");
      },
    });
    expect(r.upToDate).to.equal(true);
  });
  it("withRetry retries then succeeds, and gives up after N attempts", async () => {
    let n = 0;
    const v = await withRetry(
      async () => {
        if (++n < 3) throw new Error("flaky");
        return 42;
      },
      "t",
      5,
      1,
      2,
    );
    expect(v).to.equal(42);
    expect(n).to.equal(3);
    let m = 0;
    try {
      await withRetry(
        async () => {
          m++;
          throw new Error("always");
        },
        "t",
        3,
        1,
        2,
      );
      expect.fail("should throw");
    } catch (e: any) {
      expect(e.message).to.include("always");
      expect(m).to.equal(3);
    }
  });
});
