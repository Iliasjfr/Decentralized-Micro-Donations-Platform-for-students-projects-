import React, { useEffect, useState } from "react";
import Web3 from "web3";
import StorageContract from "./contracts/Storage.json";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [value, setValue] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const loadBlockchainData = async () => {
    try {
      // 🔥 Vérifier MetaMask
      if (!window.ethereum) {
        alert("❌ Merci d’installer MetaMask");
        return;
      }

      const web3 = new Web3(window.ethereum);

      // 🔥 Connexion MetaMask (popup)
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // 🔥 récupérer compte
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      // 🔥 réseau blockchain
      const networkId = await web3.eth.net.getId();

      const deployedNetwork = StorageContract.networks[networkId];

      if (!deployedNetwork) {
        alert("❌ Contrat non déployé sur ce réseau MetaMask/Ganache");
        setLoading(false);
        return;
      }

      // 🔥 instance contrat
      const instance = new web3.eth.Contract(
        StorageContract.abi,
        deployedNetwork.address
      );

      setContract(instance);
      setLoading(false);

    } catch (error) {
      console.error("Erreur blockchain:", error);
      setLoading(false);
    }
  };

  // 🟡 SET value (transaction → MetaMask popup)
  const setData = async () => {
    if (!contract || !account) return;

    try {
      await contract.methods
        .set(inputValue)
        .send({ from: account });
    } catch (err) {
      console.error("Set error:", err);
    }
  };

  // 🟢 GET value (lecture simple)
  const getData = async () => {
    if (!contract) return;

    try {
      const result = await contract.methods.get().call();
      setValue(result);
    } catch (err) {
      console.error("Get error:", err);
    }
  };

  if (loading) {
    return <h3>🔄 Loading blockchain...</h3>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🟢 Première application Décentralisée Blockchain (ISSIC)</h2>

      <p>
        <b>Account:</b> {account}
      </p>

      <input
        type="number"
        placeholder="Enter value"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />

      <button onClick={setData} disabled={!contract}>
        Set Value
      </button>

      <button onClick={getData} disabled={!contract}>
        Get Value
      </button>

      <h3>Stored Value: {value}</h3>
    </div>
  );
}

export default App;