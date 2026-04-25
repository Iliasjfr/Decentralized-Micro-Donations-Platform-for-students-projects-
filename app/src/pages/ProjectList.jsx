import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useWallet from "../hooks/useWallet";
import ProjectCard from "../components/ProjectCard";
import CONTRACT_ABI from "../contracts/Storage.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export default function ProjectList() {
  const { account, web3, connect, shortAddress } = useWallet();
  const navigate = useNavigate();

  const [projets, setProjets]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState("Tous");

  const FILTERS = ["Tous", "En cours", "Financé", "Expiré", "Clôturé"];

  useEffect(() => {
    if (!web3) return;
    fetchProjets();
    // eslint-disable-next-line
  }, [web3]);

  const fetchProjets = async () => {
    setLoading(true);
    setError(null);
    try {
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      // Fetch all project IDs via compteurId
      const total = await contract.methods._compteurId().call();
      const list  = [];
      for (let i = 1; i <= parseInt(total); i++) {
        const details = await contract.methods.getDetails(i).call();
        const statut  = await contract.methods.getStatut(i).call();
        list.push({
          id:                  i,
          titre:               details[0],
          description:         details[1],
          porteur:             details[2],
          objectifFinancement: web3.utils.fromWei(details[3], "ether"),
          montantCollecte:     web3.utils.fromWei(details[4], "ether"),
          deadline:            details[5],
          actif:               details[6],
          fondsRetires:        details[7],
          statut,
        });
      }
      setProjets(list);
    } catch (err) {
      setError("Erreur lors du chargement des projets.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "Tous"
    ? projets
    : projets.filter((p) => p.statut === filter);

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-2">
              Exploration
            </p>
            <h1 className="text-3xl font-bold">Tous les projets</h1>
            <p className="text-zinc-400 text-sm mt-1">{projets.length} projets trouvés</p>
          </div>

          {/* Wallet */}
          {!account ? (
            <button
              onClick={connect}
              className="px-5 py-2.5 rounded-xl border border-amber-500/50 text-amber-400
                         hover:bg-amber-500/10 transition text-sm font-medium whitespace-nowrap"
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

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition
                ${filter === f
                  ? "bg-amber-500 text-zinc-950 border-amber-500"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* States */}
        {!web3 && (
          <div className="text-center py-24 text-zinc-500 text-sm">
            Connectez votre portefeuille pour voir les projets.
          </div>
        )}
        {loading && (
          <div className="text-center py-24 text-zinc-500 text-sm animate-pulse">
            Chargement des projets...
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((projet) => (
              <ProjectCard
                key={projet.id}
                projet={projet}
                onClick={(id) => navigate(`/projet/${id}`)}
              />
            ))}
          </div>
        )}

        {!loading && web3 && filtered.length === 0 && (
          <div className="text-center py-24 text-zinc-500 text-sm">
            Aucun projet trouvé pour ce filtre.
          </div>
        )}
      </div>
    </div>
  );
}
