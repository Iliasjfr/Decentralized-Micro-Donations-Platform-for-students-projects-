/**
 * pages/DonatePage.jsx
 *
 * Displays a single project's details + donation form + funding progress.
 * Route: /donate/:projectId
 *
 * Reads project details from Person A's MicroDons contract.
 * Sends donation via Person B's Donation contract.
 * Listens to DonationReceived and FundsWithdrawn events.
 */

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useContract from "../hooks/useContract";
import DonationForm from "../components/DonationForm";
import FundingProgress from "../components/FundingProgress";

export default function DonatePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projectContract, donationContract, web3, account, loading, error } =
    useContract();

  const [project, setProject] = useState(null);
  const [raisedWei, setRaisedWei] = useState("0");
  const [funded, setFunded] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  const id = parseInt(projectId, 10);

  const loadData = useCallback(async () => {
    if (!projectContract || !donationContract || !id) return;
    setFetching(true);
    setFetchErr(null);
    try {
      // Read from Person A's contract
      const details = await projectContract.methods.getDetails(id).call();
      setProject({
        id,
        titre: details[0],
        description: details[1],
        porteur: details[2],
        objectif: details[3],   // Wei
        montantCollecte: details[4],
        deadline: details[5],
        actif: details[6],
        fondsRetires: details[7],
      });

      // Read from Donation contract
      const raised = await donationContract.methods
        .totalRaisedPerProject(id)
        .call();
      setRaisedWei(raised);

      const isFunded = await donationContract.methods.isFunded(id).call();
      setFunded(isFunded);
    } catch (e) {
      console.error(e);
      setFetchErr("Could not load project. Check the project ID.");
    } finally {
      setFetching(false);
    }
  }, [projectContract, donationContract, id]);

  // Initial load
  useEffect(() => {
    if (!loading) loadData();
  }, [loading, loadData]);

  // ── Event listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!donationContract || !id) return;

    const donationSub = donationContract.events
      .DonationReceived({ filter: { projectId: id } })
      .on("data", (event) => {
        console.log("DonationReceived event:", event.returnValues);
        setRaisedWei(event.returnValues.newTotal);
      });

    const withdrawSub = donationContract.events
      .FundsWithdrawn({ filter: { projectId: id } })
      .on("data", () => {
        loadData();
      });

    const fundedSub = donationContract.events
      .ProjectFunded({ filter: { projectId: id } })
      .on("data", () => {
        setFunded(true);
      });

    return () => {
      donationSub.unsubscribe?.();
      withdrawSub.unsubscribe?.();
      fundedSub.unsubscribe?.();
    };
  }, [donationContract, id, loadData]);

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading || fetching) return <p style={styles.info}>🔄 Loading project...</p>;
  if (error) return <p style={styles.err}>❌ Wallet error: {error}</p>;
  if (fetchErr) return <p style={styles.err}>❌ {fetchErr}</p>;
  if (!project) return <p style={styles.info}>Project not found.</p>;

  const isOwner = account?.toLowerCase() === project.porteur?.toLowerCase();
  const totalRaisedWei = BigInt(raisedWei) + BigInt(project.montantCollecte || "0");

  return (
    <div style={styles.page}>
      <button onClick={() => navigate(-1)} style={styles.back}>← Back</button>

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>{project.titre}</h2>
          <span style={{
            ...styles.badge,
            backgroundColor: project.actif ? "#dcfce7" : "#fef2f2",
            color: project.actif ? "#15803d" : "#b91c1c",
          }}>
            {project.actif ? (funded ? "✅ Funded" : "🔄 Active") : "🔴 Closed"}
          </span>
        </div>

        <p style={styles.desc}>{project.description}</p>

        <p style={styles.meta}>
          <strong>Project owner:</strong>{" "}
          <code style={styles.addr}>{project.porteur}</code>
        </p>

        {/* Funding progress */}
        <div style={styles.progressBox}>
          <FundingProgress
            raised={totalRaisedWei.toString()}
            goal={project.objectif}
            isFunded={funded}
            isWei={true}
          />
        </div>

        {/* Donation form – hide if closed or owner */}
        {project.actif && !isOwner && !project.fondsRetires && (
          <div style={styles.formBox}>
            <DonationForm
              projectId={id}
              donationContract={donationContract}
              account={account}
              web3={web3}
              onSuccess={loadData}
            />
          </div>
        )}

        {isOwner && (
          <p style={styles.ownerNote}>
            👤 You own this project. You cannot donate to your own project.
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 680, margin: "0 auto", padding: "24px 16px" },
  back: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6366f1",
    fontSize: 14,
    marginBottom: 16,
    padding: 0,
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 28,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: "#1e293b" },
  badge: { fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" },
  desc: { color: "#475569", fontSize: 15, marginBottom: 16 },
  meta: { fontSize: 13, color: "#64748b", marginBottom: 20 },
  addr: { backgroundColor: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontSize: 12 },
  progressBox: { marginBottom: 24 },
  formBox: { marginTop: 8 },
  ownerNote: { marginTop: 16, fontSize: 13, color: "#92400e", backgroundColor: "#fef3c7", padding: "8px 12px", borderRadius: 8 },
  info: { padding: 40, textAlign: "center", color: "#64748b" },
  err: { padding: 40, textAlign: "center", color: "#dc2626" },
};
