import React, { useState } from "react";
import useWallet from "../hooks/useWallet";
import CONTRACT_ABI  from "../contracts/Project.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

export default function CreateProject() {
  const { account, web3, connect, shortAddress } = useWallet();

  const [form, setForm] = useState({
    titre:       "",
    description: "",
    objectif:    "",
    deadline:    "",
  });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(null);
  const [error, setError]       = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!account) return setError("Connectez votre portefeuille d'abord.");

    try {
      setLoading(true);
      const contract  = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      const objectifWei = web3.utils.toWei(form.objectif, "ether");

      const tx = await contract.methods
        .creerProjet(form.titre, form.description, objectifWei)
        .send({ from: account });

      setSuccess(`Projet créé ! TX: ${tx.transactionHash}`);
      setForm({ titre: "", description: "", objectif: "", deadline: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-12">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-2">
            Nouveau projet
          </p>
          <h1 className="text-3xl font-bold text-white">Créer un projet</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Lancez votre campagne de financement décentralisé.
          </p>
        </div>

        {/* Wallet connect */}
        {!account ? (
          <button
            onClick={connect}
            className="mb-8 w-full py-3 rounded-xl border border-amber-500/50 text-amber-400
                       hover:bg-amber-500/10 transition text-sm font-medium"
          >
            Connecter MetaMask
          </button>
        ) : (
          <div className="mb-8 flex items-center gap-2 text-sm text-zinc-400">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            Connecté : <span className="text-white font-mono">{shortAddress}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Titre */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider">
              Titre *
            </label>
            <input
              name="titre"
              value={form.titre}
              onChange={handleChange}
              required
              placeholder="Mon super projet"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white
                         placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Décrivez votre projet..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white
                         placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition text-sm resize-none"
            />
          </div>

          {/* Objectif */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider">
              Objectif (ETH) *
            </label>
            <input
              name="objectif"
              type="number"
              step="0.001"
              min="0.001"
              value={form.objectif}
              onChange={handleChange}
              required
              placeholder="1.5"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white
                         placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition text-sm"
            />
          </div>

          {/* Feedback */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 text-sm break-all">
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !account}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40
                       disabled:cursor-not-allowed text-zinc-950 font-semibold rounded-xl
                       transition text-sm"
          >
            {loading ? "Transaction en cours..." : "Créer le projet"}
          </button>
        </form>
      </div>
    </div>
  );
}
