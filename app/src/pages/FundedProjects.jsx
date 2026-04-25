/**
 * pages/FundedProjects.jsx
 *
 * Shows only projects that have reached their funding goal.
 * Restricted visibility: only shows funded projects (not active/expired).
 * Route: /funded
 *
 * Listens to ProjectFunded events to update list in real time.
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useContract from "../hooks/useContract";
import FundingProgress from "../components/FundingProgress";

const MAX_PROJECT_SCAN = 100;

export default function FundedProjects() {
  const navigate = useNavigate();
  const { projectContract, donationContract, web3, loading, error } = useContract();

  const [projects, setProjects] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  const loadFunded = useCallback(async () => {
    if (!projectContract || !donationContract) return;
    setFetching(true);
    setFetchErr(null);
    try {
      const funded = [];
      // Scan all project IDs up to MAX
      // Production note: replace with on-chain event log query for scale
      for (let i = 1; i <= MAX_PROJECT_SCAN; i++) {
        try {
          const isFunded = await donationContract.methods
            .isFunded(i)
            .call();
          if (!isFunded) continue;

          const details = await projectContract.methods.getDetails(i).call();
          const raised = await donationContract.methods
            .totalRaisedPerProject(i)
            .call();

          funded.push({
            id: i,
            titre: details[0],
            description: details[1],
            porteur: details[2],
            objectif: details[3],
            montantCollecte: details[4],
            actif: details[6],
            raisedViaDonation: raised,
          });
        } catch {
          // Project ID doesn't exist — stop scanning
          break;
        }
      }
      setProjects(funded);
    } catch (e) {
      console.error(e);
      setFetchErr("Could not load funded projects.");
    } finally {
      setFetching(false);
    }
  }, [projectContract, donationContract]);

  useEffect(() => {
    if (!loading) loadFunded();
  }, [loading, loadFunded]);

  // Live event: add newly funded projects without full reload
  useEffect(() => {
    if (!donationContract) return;
    const sub = donationContract.events.ProjectFunded().on("data", () => {
      loadFunded();
    });
    return () => sub.unsubscribe?.();
  }, [donationContract, loadFunded]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading || fetching) return <p style={styles.info}>🔄 Loading funded projects...</p>;
  if (error) return <p style={styles.err}>❌ {error}</p>;
  if (fetchErr) return <p style={styles.err}>❌ {fetchErr}</p>;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>✅ Funded Projects</h2>
      <p style={styles.sub}>
        These projects have reached their funding goal and are fully financed.
      </p>

      {projects.length === 0 ? (
        <div style={styles.empty}>
          <p>No projects have been fully funded yet.</p>
          <button onClick={() => navigate("/")} style={styles.cta}>
            Browse Active Projects →
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map((p) => {
            const totalWei = (
              BigInt(p.montantCollecte || 0) +
              BigInt(p.raisedViaDonation || 0)
            ).toString();
            return (
              <div key={p.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <span style={styles.fundedBadge}>✅ Funded</span>
                  <span style={styles.projectId}>#{p.id}</span>
                </div>

                <h3 style={styles.cardTitle}>{p.titre}</h3>
                <p style={styles.cardDesc}>
                  {p.description.length > 120
                    ? p.description.slice(0, 117) + "..."
                    : p.description}
                </p>

                <p style={styles.owner}>
                  Owner: <code style={styles.addr}>{p.porteur.slice(0, 6)}...{p.porteur.slice(-4)}</code>
                </p>

                <FundingProgress
                  raised={totalWei}
                  goal={p.objectif}
                  isFunded={true}
                  isWei={true}
                />

                <button
                  onClick={() => navigate(`/donate/${p.id}`)}
                  style={styles.viewBtn}
                >
                  View Details →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
  heading: { margin: "0 0 6px", fontSize: 26, fontWeight: 700, color: "#1e293b" },
  sub: { fontSize: 14, color: "#64748b", marginBottom: 28 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 20,
  },
  card: {
    border: "1px solid #d1fae5",
    borderRadius: 12,
    padding: 20,
    backgroundColor: "#f0fdf4",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  fundedBadge: {
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: "#dcfce7",
    color: "#15803d",
    padding: "3px 10px",
    borderRadius: 99,
  },
  projectId: { fontSize: 12, color: "#94a3b8" },
  cardTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" },
  cardDesc: { margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 },
  owner: { margin: 0, fontSize: 12, color: "#64748b" },
  addr: { backgroundColor: "#e0f2fe", padding: "1px 5px", borderRadius: 4, fontSize: 11 },
  viewBtn: {
    marginTop: "auto",
    background: "none",
    border: "1px solid #16a34a",
    color: "#16a34a",
    padding: "7px 14px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  empty: { textAlign: "center", padding: "60px 0", color: "#64748b" },
  cta: {
    marginTop: 12,
    padding: "10px 20px",
    backgroundColor: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  info: { padding: 40, textAlign: "center", color: "#64748b" },
  err: { padding: 40, textAlign: "center", color: "#dc2626" },
};
