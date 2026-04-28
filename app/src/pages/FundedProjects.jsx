/**
 * pages/FundedProjects.jsx — FIXED
 *
 * Fix: replaced useContract (missing hook) with useWallet + direct contract init
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useWallet from "../hooks/useWallet";
import FundingProgress from "../components/FundingProgress";
import PROJECT_JSON   from "../contracts/Project.json";
import DONATION_JSON  from "../contracts/Donation.json";

const PROJECT_ABI      = PROJECT_JSON.abi;
const DONATION_ABI     = DONATION_JSON.abi;
const PROJECT_ADDRESS  =
  process.env.REACT_APP_CONTRACT_ADDRESS ||
  process.env.REACT_APP_PROJECT_CONTRACT ||
  PROJECT_JSON.networks?.["5777"]?.address;
const DONATION_ADDRESS =
  process.env.REACT_APP_DONATION_CONTRACT ||
  DONATION_JSON.networks?.["5777"]?.address;

const MAX_PROJECT_SCAN = 100;

export default function FundedProjects() {
  const navigate = useNavigate();
  const { web3, connect, account, shortAddress } = useWallet();

  const [projects, setProjects]   = useState([]);
  const [fetching, setFetching]   = useState(false);
  const [fetchErr, setFetchErr]   = useState(null);

  const loadFunded = useCallback(async () => {
    if (!web3) return;
    setFetching(true);
    setFetchErr(null);
    try {
      const projectContract  = new web3.eth.Contract(PROJECT_ABI,  PROJECT_ADDRESS);
      const donationContract = new web3.eth.Contract(DONATION_ABI, DONATION_ADDRESS);

      const funded = [];
      for (let i = 1; i <= MAX_PROJECT_SCAN; i++) {
        try {
          const isFunded = await donationContract.methods.isFunded(i).call();
          if (!isFunded) continue;

          const details = await projectContract.methods.getDetails(i).call();
          const raised  = await donationContract.methods.totalRaisedPerProject(i).call();

          funded.push({
            id:               i,
            titre:            details[0],
            description:      details[1],
            porteur:          details[2],
            objectif:         details[3],
            montantCollecte:  details[4],
            actif:            details[6],
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
  }, [web3]);

  useEffect(() => {
    if (web3) loadFunded();
  }, [web3, loadFunded]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!web3) return (
    <div style={styles.page}>
      <h2 style={styles.heading}>✅ Funded Projects</h2>
      <div style={{ textAlign: "center", paddingTop: 60 }}>
        <p style={{ color: "#64748b", marginBottom: 16 }}>
          Connect your wallet to view funded projects.
        </p>
        <button onClick={connect} style={styles.cta}>Connect MetaMask</button>
      </div>
    </div>
  );

  if (fetching) return <p style={styles.info}>🔄 Loading funded projects...</p>;
  if (fetchErr) return <p style={styles.err}>❌ {fetchErr}</p>;

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={styles.heading}>✅ Funded Projects</h2>
          <p style={styles.sub}>
            These projects have reached their funding goal and are fully financed.
          </p>
        </div>
        {account && (
          <div style={{ fontSize: 13, color: "#64748b" }}>
            🟢 <span style={{ fontFamily: "monospace" }}>{shortAddress}</span>
          </div>
        )}
      </div>

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
                  Owner:{" "}
                  <code style={styles.addr}>
                    {p.porteur.slice(0, 6)}...{p.porteur.slice(-4)}
                  </code>
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
  page:    { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
  heading: { margin: "0 0 6px", fontSize: 26, fontWeight: 700, color: "#1e293b" },
  sub:     { fontSize: 14, color: "#64748b", marginBottom: 28 },
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
  cardTop:     { display: "flex", justifyContent: "space-between", alignItems: "center" },
  fundedBadge: {
    fontSize: 11, fontWeight: 700,
    backgroundColor: "#dcfce7", color: "#15803d",
    padding: "3px 10px", borderRadius: 99,
  },
  projectId: { fontSize: 12, color: "#94a3b8" },
  cardTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" },
  cardDesc:  { margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 },
  owner:     { margin: 0, fontSize: 12, color: "#64748b" },
  addr:      { backgroundColor: "#e0f2fe", padding: "1px 5px", borderRadius: 4, fontSize: 11 },
  viewBtn: {
    marginTop: "auto",
    background: "none",
    border: "1px solid #16a34a",
    color: "#16a34a",
    padding: "7px 14px",
    borderRadius: 7,
    fontSize: 13, fontWeight: 600,
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
    fontSize: 14, fontWeight: 600,
    cursor: "pointer",
  },
  info: { padding: 40, textAlign: "center", color: "#64748b" },
  err:  { padding: 40, textAlign: "center", color: "#dc2626" },
};
