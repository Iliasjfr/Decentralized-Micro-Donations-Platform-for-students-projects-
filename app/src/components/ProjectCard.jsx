import React from "react";
import FundingProgress from "./FundingProgress";

export default function ProjectCard({ projet, onClick, onDonateClick }) {
  

  const statusColors = {
    "En cours":  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "Financé":   "bg-blue-500/20    text-blue-300    border-blue-500/30",
    "Expiré":    "bg-red-500/20     text-red-300     border-red-500/30",
    "Clôturé":   "bg-zinc-500/20    text-zinc-300    border-zinc-500/30",
  };

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/50 hover:bg-zinc-800/80 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
      
      {/* Clickable content area (goes to project detail) */}
      <div
        onClick={() => onClick && onClick(projet.id)}
        className="p-6 cursor-pointer"
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

      {/* Donate button area - only show if project is active */}
      {projet.statut === "En cours" && (
        <div className="px-6 pb-6 pt-0">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the card click
              onDonateClick && onDonateClick(projet.id);
            }}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 
                       text-zinc-950 font-semibold text-sm transition-all duration-200
                       active:scale-95 shadow-lg shadow-amber-500/20"
          >
            🤝 Faire un don
          </button>
        </div>
      )}
      
      {/* Disabled state for non-active projects */}
      {projet.statut !== "En cours" && (
        <div className="px-6 pb-6 pt-0">
          <button
            disabled
            className="w-full py-2.5 rounded-xl bg-zinc-800 
                       text-zinc-500 font-semibold text-sm cursor-not-allowed"
          >
            {projet.statut === "Financé" ? "✅ Projet financé" : 
             projet.statut === "Expiré" ? "⏰ Projet expiré" : 
             "🔒 Projet clôturé"}
          </button>
        </div>
      )}
    </div>
  );
}