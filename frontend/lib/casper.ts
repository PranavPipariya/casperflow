// Casper blockchain integration
const RPC_URL = 'https://node.testnet.casper.network/rpc';
const CHAIN_NAME = 'casper-test';
const CONTRACT_HASH = '430d190b13d41b456a9fdf1eb8c6b49d0e0239d7ee72186f015022d090e9bf23';

export async function connectWallet(): Promise<string | null> {
  try {
    // @ts-ignore - CasperWalletProvider is injected by CSPR.click
    if (!window.CasperWalletProvider) {
      alert('Please install CSPR.click wallet extension from https://www.cspr.click/');
      return null;
    }

    // @ts-ignore
    const provider = window.CasperWalletProvider();
    await provider.requestConnection();
    const isConnected = await provider.isConnected();

    if (isConnected) {
      const publicKey = await provider.getActivePublicKey();
      return publicKey;
    }
    return null;
  } catch (error) {
    console.error('Wallet connection failed:', error);
    return null;
  }
}

export async function getAccountBalance(publicKeyHex: string): Promise<string> {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'state_get_balance',
        params: {
          state_root_hash: await getStateRootHash(),
          purse_uref: await getPurseUref(publicKeyHex)
        }
      })
    });

    const data = await response.json();
    if (data.result && data.result.balance_value) {
      return (Number(data.result.balance_value) / 1e9).toFixed(2);
    }
    return '0';
  } catch (error) {
    console.error('Balance fetch failed:', error);
    return '0';
  }
}

async function getStateRootHash(): Promise<string> {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'chain_get_state_root_hash',
      params: {}
    })
  });
  const data = await response.json();
  return data.result.state_root_hash;
}

async function getPurseUref(publicKeyHex: string): Promise<string> {
  const stateRootHash = await getStateRootHash();
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'state_get_item',
      params: {
        state_root_hash: stateRootHash,
        key: `account-hash-${publicKeyHex.substring(2)}`,
        path: []
      }
    })
  });
  const data = await response.json();
  return data.result?.Account?.main_purse || '';
}

export async function stakeCSPR(publicKeyHex: string, amount: string): Promise<string> {
  // This would integrate with the deployed contract
  // For now, demonstrate the flow
  alert(`Staking ${amount} CSPR\n\nContract: ${CONTRACT_HASH}\nNetwork: Casper Testnet\n\nThis demonstrates the integration flow. In production, this would create a deploy to call the deposit() entry point.`);

  // Return a mock deploy hash for demonstration
  return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function unstakeCSPR(publicKeyHex: string, amount: string, instant: boolean): Promise<string> {
  alert(`Unstaking ${amount} stCSPR\nInstant: ${instant}\nFee: ${instant ? '0.5%' : '0%'}\n\nThis demonstrates the unstaking flow. In production, this would call the withdraw() entry point.`);

  return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function getDeployStatus(deployHash: string): Promise<string> {
  // Mock status check
  if (deployHash.startsWith('demo-')) {
    // Simulate pending then success
    return 'Success';
  }

  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'info_get_deploy',
        params: { deploy_hash: deployHash }
      })
    });

    const data = await response.json();
    if (data.result && data.result.execution_results) {
      const result = data.result.execution_results[0];
      if (result.result.Success) return 'Success';
      if (result.result.Failure) return 'Failed';
    }
    return 'Pending';
  } catch (error) {
    return 'Pending';
  }
}
