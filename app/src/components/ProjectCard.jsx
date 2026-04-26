import React from "react";
import FundingProgress from "./FundingProgress";

export default function ProjectCard({ projet, onClick }) {
  

  const statusColors = {
    "En cours":  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "Financé":   "bg-blue-500/20    text-blue-300    border-blue-500/30",
    "Expiré":    "bg-red-500/20     text-red-300     border-red-500/30",
    "Clôturé":   "bg-zinc-500/20    text-zinc-300    border-zinc-500/30",
  };

  return (
    <div
      onClick={() => onClick && onClick(projet.id)}
      className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 cursor-pointer
                 hover:border-amber-500/50 hover:bg-zinc-800/80 transition-all duration-300
                 hover:shadow-lg hover:shadow-amber-500/10"
    >
      {/* Status badge */}
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mb-4
                        ${statusColors[projet.statut] || statusColors["En cours"]}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
        {projet.statut || "En cours"}
      </span>

      {/* Title */}
      <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-amber-400 transition-colors line-clamp-1">
        {projet.titre}
      </h3>

      {/* Description */}
      <p className="text-zinc-400 text-sm mb-5 line-clamp-2 leading-relaxed">
        {projet.description}
      </p>

      {/* Progress bar */}
      <FundingProgress
        montantCollecte={projet.montantCollecte}
        objectifFinancement={projet.objectifFinancement}
      />

      {/* Objectif */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
        <span className="text-xs text-zinc-500">Objectif</span>
        <span className="text-sm font-medium text-amber-400">
          {parseFloat(projet.objectifFinancement).toFixed(3)} ETH
        </span>
      </div>
    </div>
  );
}
