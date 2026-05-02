import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useContract from "../hooks/useContract";
import ProjectCard from "../components/ProjectCard";

export default function ProjectList() {
  const { account, web3, projectContract, loading: contractLoading, error: contractError } = useContract();
  const navigate = useNavigate();

  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState("Tous");

  const FILTERS = ["Tous", "En cours", "Financé", "Expiré", "Clôturé"];

  useEffect(() => {
    if (!projectContract) return;
    fetchProjets();
    // eslint-disable-next-line
  }, [projectContract]);

  const fetchProjets = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = [];
      let i = 1;
      while (true) {
        try {
          const details = await projectContract.methods.getDetails(i).call();
          const statut  = await projectContract.methods.getStatut(i).call();
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
          i++;
        } catch {
          break;
        }
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
          {account ? (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="font-mono text-white">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
          ) : null}
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
        {contractLoading && (
          <div className="text-center py-24 text-zinc-500 text-sm animate-pulse">
            Connexion au contrat...
          </div>
        )}
        {(error || contractError) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
            {error || contractError}
          </div>
        )}
        {!contractLoading && loading && (
          <div className="text-center py-24 text-zinc-500 text-sm animate-pulse">
            Chargement des projets...
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((projet) => (
              <ProjectCard
                key={projet.id}
                projet={projet}
                onClick={(id) => navigate(`/project/${id}`)}
              />
            ))}
          </div>
        )}

        {!loading && !contractLoading && filtered.length === 0 && !error && !contractError && (
          <div className="text-center py-24 text-zinc-500 text-sm">
            Aucun projet trouvé pour ce filtre.
          </div>
        )}
      </div>
    </div>
  );
}