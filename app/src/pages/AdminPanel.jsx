import React, { useEffect, useState } from "react";
import useWallet from "../hooks/useWallet";
import CONTRACT_ABI from "../contracts/Project.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export default function AdminPanel() {
  const { account, web3, connect, shortAddress } = useWallet();

  const [isAdmin, setIsAdmin]     = useState(false);
  const [projets, setProjets]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [actionId, setActionId]   = useState(null);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);

  useEffect(() => {
    if (!web3 || !account) return;
    checkAdmin();
    // eslint-disable-next-line
  }, [web3, account]);

  const checkAdmin = async () => {
    try {
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      const admin    = await contract.methods.administrator().call();
      setIsAdmin(admin.toLowerCase() === account.toLowerCase());
      if (admin.toLowerCase() === account.toLowerCase()) fetchProjets(contract);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjets = async (contract) => {
    setLoading(true);
    try {
      const c      = contract || new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      const total  = await c.methods._compteurId().call();
      const list   = [];
      for (let i = 1; i <= parseInt(total); i++) {
        const details = await c.methods.getDetails(i).call();
        const statut  = await c.methods.getStatut(i).call();
        list.push({
          id:              i,
          titre:           details[0],
          porteur:         details[2],
          montantCollecte: web3.utils.fromWei(details[4], "ether"),
          actif:           details[6],
          fondsRetires:    details[7],
          statut,
        });
      }
      setProjets(list);
    } catch (err) {
      setError("Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  const handleDesactiver = async (id) => {
    setError(null); setSuccess(null); setActionId(id);
    try {
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      await contract.methods.desactiverProjet(id).send({ from: account });
      setSuccess(`Projet #${id} désactivé.`);
      fetchProjets();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const statusColor = {
    "En cours": "text-emerald-400",
    "Financé":  "text-blue-400",
    "Expiré":   "text-red-400",
    "Clôturé":  "text-zinc-400",
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-2">
              Administration
            </p>
            <h1 className="text-3xl font-bold">Panel Admin</h1>
          </div>

          {!account ? (
            <button
              onClick={connect}
              className="px-5 py-2.5 rounded-xl border border-amber-500/50 text-amber-400
                         hover:bg-amber-500/10 transition text-sm font-medium"
            >
              Connecter MetaMask
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="font-mono text-white">{shortAddress}</span>
            </div>
          )}
        </div>

        {/* Not admin */}
        {account && !isAdmin && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 text-sm">
            Accès refusé — vous n'êtes pas l'administrateur de ce contrat.
          </div>
        )}

        {/* Not connected */}
        {!account && (
          <div className="text-center py-24 text-zinc-500 text-sm">
            Connectez votre portefeuille pour accéder au panel.
          </div>
        )}

        {/* Admin content */}
        {isAdmin && (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 text-sm mb-4">
                {success}
              </div>
            )}

            {loading ? (
              <div className="text-center py-24 text-zinc-500 text-sm animate-pulse">
                Chargement...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left">#</th>
                      <th className="px-5 py-3 text-left">Titre</th>
                      <th className="px-5 py-3 text-left">Porteur</th>
                      <th className="px-5 py-3 text-left">Collecté</th>
                      <th className="px-5 py-3 text-left">Statut</th>
                      <th className="px-5 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projets.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition">
                        <td className="px-5 py-4 text-zinc-500 font-mono">{p.id}</td>
                        <td className="px-5 py-4 text-white font-medium">{p.titre}</td>
                        <td className="px-5 py-4 text-zinc-400 font-mono text-xs">
                          {p.porteur.slice(0,6)}...{p.porteur.slice(-4)}
                        </td>
                        <td className="px-5 py-4 text-amber-400">{parseFloat(p.montantCollecte).toFixed(3)} ETH</td>
                        <td className={`px-5 py-4 font-medium ${statusColor[p.statut] || "text-zinc-400"}`}>
                          {p.statut}
                        </td>
                        <td className="px-5 py-4">
                          {p.actif && (
                            <button
                              onClick={() => handleDesactiver(p.id)}
                              disabled={actionId === p.id}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30
                                         hover:bg-red-500/20 text-xs transition disabled:opacity-40"
                            >
                              {actionId === p.id ? "..." : "Désactiver"}
                            </button>
                          )}
                          {!p.actif && (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
