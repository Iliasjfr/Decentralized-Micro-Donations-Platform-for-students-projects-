import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useWallet from "../hooks/useWallet";
import CONTRACT_ABI from "../contracts/Project.json";
import DonatePage from "./DonatePage";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export default function ProjectDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { account, web3, connect, shortAddress } = useWallet();

  const [projet, setProjet]         = useState(null);
  const [contributors, setContributors] = useState([]);
  const [statut, setStatut]         = useState("");
  const [montant, setMontant]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [txLoading, setTxLoading]   = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);

  useEffect(() => {
    if (!web3) return;
    fetchDetails();
    // eslint-disable-next-line
  }, [web3, id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      const details  = await contract.methods.getDetails(id).call();
      const st       = await contract.methods.getStatut(id).call();
      const contribs = await contract.methods.getContributors(id).call();

      setProjet({
        id,
        titre:               details[0],
        description:         details[1],
        porteur:             details[2],
        objectifFinancement: web3.utils.fromWei(details[3], "ether"),
        montantCollecte:     web3.utils.fromWei(details[4], "ether"),
        deadline:            new Date(parseInt(details[5]) * 1000).toLocaleDateString("fr-FR"),
        actif:               details[6],
        fondsRetires:        details[7],
      });
      setStatut(st);
      setContributors(contribs);
    } catch (err) {
      setError("Projet introuvable.");
    } finally {
      setLoading(false);
    }
  };

  const handleDon = async () => {
    setError(null);
    setSuccess(null);
    if (!account) return setError("Connectez votre portefeuille.");
    if (!montant || parseFloat(montant) <= 0) return setError("Montant invalide.");

    try {
      setTxLoading(true);
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      const valWei   = web3.utils.toWei(montant, "ether");
      await contract.methods.donner(id).send({ from: account, value: valWei });
      setSuccess("Don effectué avec succès !");
      setMontant("");
      fetchDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setTxLoading(false);
    }
  };

  const progress = projet
    ? Math.min((parseFloat(projet.montantCollecte) / parseFloat(projet.objectifFinancement)) * 100, 100)
    : 0;

  const statusColors = {
    "En cours": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    "Financé":  "text-blue-400    bg-blue-500/10    border-blue-500/30",
    "Expiré":   "text-red-400     bg-red-500/10     border-red-500/30",
    "Clôturé":  "text-zinc-400    bg-zinc-500/10    border-zinc-500/30",
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-500 hover:text-white text-sm mb-8 flex items-center gap-1 transition"
        >
          ← Retour
        </button>

        {/* Wallet */}
        {!account && (
          <button
            onClick={connect}
            className="mb-6 w-full py-3 rounded-xl border border-amber-500/50 text-amber-400
                       hover:bg-amber-500/10 transition text-sm font-medium"
          >
            Connecter MetaMask
          </button>
        )}

        {loading && (
          <div className="text-center py-24 text-zinc-500 text-sm animate-pulse">
            Chargement...
          </div>
        )}

        {projet && (
          <>
            {/* Status */}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-4
                              ${statusColors[statut] || statusColors["En cours"]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
              {statut}
            </span>

            {/* Title */}
            <h1 className="text-3xl font-bold mb-3">{projet.titre}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">{projet.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: "Collecté",  value: `${parseFloat(projet.montantCollecte).toFixed(3)} ETH` },
                { label: "Objectif",  value: `${parseFloat(projet.objectifFinancement).toFixed(3)} ETH` },
                { label: "Deadline",  value: projet.deadline },
                { label: "Porteur",   value: `${projet.porteur.slice(0,6)}...${projet.porteur.slice(-4)}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">{label}</p>
                  <p className="text-white font-semibold text-sm font-mono">{value}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-zinc-500 mb-2">
                <span>Progression</span>
                <span className="text-amber-400 font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <button
                onClick={() => navigate(`/donate/${id}`)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-xl text-sm transition"
                >
                Faire un don
            </button>

            {/* Don form */}
            {statut === "En cours" && account && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
                <h2 className="text-sm font-semibold mb-4 text-zinc-200">Faire un don</h2>
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="0.01 ETH"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5
                               text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-sm transition"
                  />
                  <button
                    onClick={handleDon}
                    disabled={txLoading}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold
                               rounded-xl text-sm transition disabled:opacity-40"
                  >
                    {txLoading ? "..." : "Donner"}
                  </button>
                </div>
                {error   && <p className="text-red-400 text-xs mt-3">{error}</p>}
                {success && <p className="text-emerald-400 text-xs mt-3">{success}</p>}
              </div>
            )}

            {/* Contributors */}
            <div>
              <h2 className="text-sm font-semibold text-zinc-200 mb-4">
                Contributeurs ({contributors.length})
              </h2>
              {contributors.length === 0 ? (
                <p className="text-zinc-500 text-sm">Aucun contributeur pour l'instant.</p>
              ) : (
                <div className="space-y-2">
                  {contributors.map((addr, i) => (
                    <div key={i}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3
                                 font-mono text-xs text-zinc-400">
                      {addr}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
