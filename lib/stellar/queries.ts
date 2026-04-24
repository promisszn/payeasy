  throw new ContractQueryError(
    `Cannot parse bool from retval: ${JSON.stringify(retval)}`
  );
}

/**
 * Represents the full state of a rent escrow contract on-chain.
 */
export interface ContractState {
  id: string;
  landlord: string;
  totalRent: string;
  deadline: string;
  status: "active" | "funded" | "released" | "expired";
  totalFunded: number;
  lastUpdate: string;
  roommates: {
    address: string;
    expectedShare: string;
    paidAmount: string;
    isPaid: boolean;
  }[];
}

/**
 * Fetches the full contract state from Soroban RPC and returns structured data.
 * Queries the escrow contract for all key state variables and assembles them into
 * a ContractState object. Throws ContractQueryError on any query failure.
 *
 * @param contractId The Stellar contract ID to query
 * @returns Fully populated ContractState
 */
export async function getContractState(contractId: string): Promise<ContractState> {
  const { rpcServer, networkPassphrase } = await import("./config.ts");
  const { TransactionBuilder, Address, Contract, scValToNative } = await import("@stellar/stellar-sdk");

  const buildInvocationXdr = ({ contractId, method, args = [] }: BuildInvocationParams): string => {
    const contract = new Contract(contractId);
    const source = new Address(contractId).toScAddress();
    
    const tx = new TransactionBuilder(source, {
      fee: "100",
      networkPassphrase,
    })
      .addOperation(contract.callFunction(method, ...args))
      .setTimeout(60)
      .build();
    
    return tx.toXDR();
  };

  const ctx: QueryContext = {
    client: {
      async simulateTransaction(xdr: string): Promise<SimulateTransactionResponse> {
        try {
          const result = await rpcServer.simulateTransaction(xdr);
          
          if (result.errorResult && result.errorResult.length > 0) {
            return { error: result.errorResult };
          }
          
          let retval: unknown = undefined;
          if (result.result && result.result.retval) {
            try {
              retval = scValToNative(result.result.retval);
            } catch (e) {
              retval = result.result.retval.toString();
            }
          }
          
          return {
            results: retval !== undefined ? [{ retval }] : [],
          };
        } catch (err) {
          throw new ContractQueryError(`Soroban RPC simulation failed: ${String(err)}`);
        }
      },
    },
    builder: {
      buildInvocationXdr,
    },
    contractId,
  };

  try {
    const [id, landlord, totalRent, deadline, totalFunded, isFunded] = await Promise.all([
      Promise.resolve(contractId),
      (async () => {
        try { return await getLandlord(ctx); } 
        catch (err) { throw new ContractQueryError(`Failed to query landlord address: ${err instanceof Error ? err.message : String(err)}`); }
      })(),
      (async () => {
        try { return await getTotal(ctx); } 
        catch (err) { throw new ContractQueryError(`Failed to query total rent: ${err instanceof Error ? err.message : String(err)}`); }
      })(),
      (async () => {
        try { return await getDeadline(ctx); } 
        catch (err) { throw new ContractQueryError(`Failed to query deadline: ${err instanceof Error ? err.message : String(err)}`); }
      })(),
      (async () => {
        try { 
          const fundedStr = await getTotalFunded(ctx);
          return Number(fundedStr);
        } 
        catch (err) { throw new ContractQueryError(`Failed to query total funded: ${err instanceof Error ? err.message : String(err)}`); }
      })(),
      (async () => {
        try { return await isFullyFunded(ctx); } 
        catch (err) { throw new ContractQueryError(`Failed to query funding status: ${err instanceof Error ? err.message : String(err)}`); }
      })(),
    ]);

    const status = isFunded ? "funded" as const : "active" as const;
    const roommates: ContractState["roommates"] = [];

    return {
      id,
      landlord,
      totalRent,
      deadline: new Date(parseInt(deadline) * 1000).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      }),
      status,
      totalFunded,
      lastUpdate: new Date().toISOString(),
      roommates,
    };
  } catch (err) {
    if (err instanceof ContractQueryError) throw err;
    throw new ContractQueryError(`Failed to fetch contract state: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Represents the full state of a rent escrow contract on-chain.
 */

/**
 * Fetches the native XLM balance for a Stellar account.
 * Uses Horizon API to query account balances.
 *
 * @param publicKey The Stellar public key to query
 * @returns The native XLM balance as a number
 * @throws Error if account not found or network request fails
 */
export async function getAccountBalance(publicKey: string): Promise<number> {
  const { fetchXlmBalance } = await import("./horizon.ts");
  const { getCurrentNetwork } = await import("./explorer.ts");

  try {
    const balanceStr = await fetchXlmBalance(publicKey, getCurrentNetwork());
    // Parse the balance string to number (may have decimal places)
    return Number(balanceStr);
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      throw new Error(`Account not found: ${publicKey}`);
    }
    throw err;
  }
}

