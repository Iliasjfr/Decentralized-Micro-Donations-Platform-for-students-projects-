import { useState, useEffect, useCallback } from "react";
import Web3 from "web3";

export default function useWallet() {
  const [account, setAccount]   = useState(null);
  const [web3, setWeb3]         = useState(null);
  const [network, setNetwork]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window.ethereum) throw new Error("MetaMask non détecté. Veuillez l'installer.");
      const instance = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const chainId  = await instance.eth.getChainId();
      setWeb3(instance);
      setAccount(accounts[0]);
      setNetwork(chainId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setWeb3(null);
    setNetwork(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => setAccount(accounts[0] || null);
    const handleChainChanged    = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged",    handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged",    handleChainChanged);
    };
  }, []);

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : null;

  return { account, web3, network, loading, error, connect, disconnect, shortAddress };
}
