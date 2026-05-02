import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useContract from "../hooks/useContract";

export default function ProjectDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { account, web3, projectContract, loading: contractLoading, error: contractError } = useContract();

  const [projet, setProjet]             = useState(null);
  const [contributors, setContributors] = useState([]);
  const [statut, setStatut]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    if (!projectContract) return;
    fetchDetails();
    // eslint-disable-next-line
  }, [projectContract, id]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const details  = await projectContract.methods.getDetails(parseInt(id)).call();
      const st       = await projectContract.methods.getStatut(parseInt(id)).call();
      const contribs = await projectContract.methods.getdonors(parseInt(id)).call();

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
      console.error("fetchDetails error:", err);
      setError("Projet introuvable.");
    } finally {
      setLoading(false);
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

  if (contractLoading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm animate-pulse">
      Connexion au contrat...
    </div>
  );

  if (contractError) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-400 text-sm">
      ❌ {contractError}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="text-zinc-500 hover:text-white text-sm mb-8 flex items-center gap-1 transition"
        >
          ← Retour
        </button>

        {loading && (
          <div className="text-center py-24 text-zinc-500 text-sm animate-pulse">
            Chargement...
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {projet && (
          <>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-4
                              ${statusColors[statut] || statusColors["En cours"]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
              {statut}
            </span>

            <h1 className="text-3xl font-bold mb-3">{projet.titre}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">{projet.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: "Collecté", value: `${parseFloat(projet.montantCollecte).toFixed(3)} ETH` },
                { label: "Objectif", value: `${parseFloat(projet.objectifFinancement).toFixed(3)} ETH` },
                { label: "Deadline", value: projet.deadline },
                { label: "Porteur",  value: `${projet.porteur.slice(0,6)}...${projet.porteur.slice(-4)}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 mb-1">{label}</p>
                  <p className="text-white font-semibold text-sm font-mono">{value}</p>
                </div>
              ))}
            </div>

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
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-xl text-sm transition mb-6"
            >
              Faire un don
            </button>

            

            <div>
              <h2 className="text-sm font-semibold text-zinc-200 mb-4">
                Contributeurs ({contributors.length})
              </h2>
              {contributors.length === 0 ? (
                <p className="text-zinc-500 text-sm">Aucun contributeur pour l'instant.</p>
              ) : (
                <div className="space-y-2">
                  {contributors.map((addr, i) => (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 font-mono text-xs text-zinc-400">
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