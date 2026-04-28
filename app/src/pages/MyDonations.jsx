import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useWallet from "../hooks/useWallet";
import PROJECT_JSON  from "../contracts/Project.json";
import DONATION_JSON from "../contracts/Donation.json";
import FundingProgress from "../components/FundingProgress";

const PROJECT_ABI      = PROJECT_JSON.abi;
const DONATION_ABI     = DONATION_JSON.abi;
const PROJECT_ADDRESS  =
  process.env.REACT_APP_CONTRACT_ADDRESS ||
  PROJECT_JSON.networks?.["5777"]?.address;
const DONATION_ADDRESS =
  process.env.REACT_APP_DONATION_CONTRACT ||
  DONATION_JSON.networks?.["5777"]?.address;

const MAX_PROJECT_ID_SCAN = 100;

export default function MyDonations() {
  const navigate = useNavigate();
  const { web3, account, connect, shortAddress } = useWallet();

  const [donations, setDonations] = useState([]);
  const [fetching, setFetching]   = useState(false);
  const [fetchErr, setFetchErr]   = useState(null);

  const loadDonations = useCallback(async () => {
    if (!web3 || !account) return;
    setFetching(true);
    setFetchErr(null);
    try {
      const projectContract  = new web3.eth.Contract(PROJECT_ABI,  PROJECT_ADDRESS);
      const donationContract = new web3.eth.Contract(DONATION_ABI, DONATION_ADDRESS);

      const projectIds = await donationContract.methods
        .getProjectsDonatedByUser(account, 1, MAX_PROJECT_ID_SCAN)
        .call();

      const rows = await Promise.all(
        projectIds.map(async (pid) => {
          try {
            const details = await projectContract.methods
              .getDetails(parseInt(pid, 10))
              .call();
            const amount = await donationContract.methods
              .getDonationAmount(pid, account)
              .call();
            const funded = await donationContract.methods
              .isFunded(pid)
              .call();
            return {
              projectId:       parseInt(pid, 10),
              titre:           details[0],
              objectif:        details[3],
              montantCollecte: details[4],
              actif:           details[6],
              amount,
              funded,
            };
          } catch {
            return null;
          }
        })
      );
      setDonations(rows.filter(Boolean));
    } catch (e) {
      console.error(e);
      setFetchErr("Failed to load donation history.");
    } finally {
      setFetching(false);
    }
  }, [web3, account]);

  useEffect(() => {
    if (web3 && account) loadDonations();
  }, [web3, account, loadDonations]);

  const totalEth = donations.reduce((sum, d) => {
    return sum + parseFloat(web3?.utils.fromWei(d.amount, "ether") || 0);
  }, 0);

  if (!account) return (
    <div style={styles.page}>
      <h2 style={styles.heading}>My Donations</h2>
      <div style={{ textAlign: "center", paddingTop: 60 }}>
        <p style={{ color: "#64748b", marginBottom: 16 }}>
          Please connect your wallet to view your donations.
        </p>
        <button onClick={connect} style={styles.cta}>Connect MetaMask</button>
      </div>
    </div>
  );

  if (fetching) return <p style={styles.info}>🔄 Loading your donations...</p>;
  if (fetchErr) return <p style={styles.err}>❌ {fetchErr}</p>;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>My Donations</h2>
      <p style={styles.sub}>
        Account: <code style={styles.addr}>{account}</code>
      </p>

      {donations.length === 0 ? (
        <div style={styles.empty}>
          <p>You haven't donated to any projects yet.</p>
          <button onClick={() => navigate("/")} style={styles.cta}>
            Browse Projects →
          </button>
        </div>
      ) : (
        <>
          <div style={styles.summary}>
            <span>📦 {donations.length} project{donations.length !== 1 ? "s" : ""} supported</span>
            <span>💎 {totalEth.toFixed(4)} ETH total donated</span>
          </div>

          <div style={styles.list}>
            {donations.map((d) => (
              <div key={d.projectId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{d.titre}</h3>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: d.funded ? "#dcfce7" : d.actif ? "#eff6ff" : "#fef2f2",
                    color: d.funded ? "#15803d" : d.actif ? "#1d4ed8" : "#b91c1c",
                  }}>
                    {d.funded ? "✅ Funded" : d.actif ? "🔄 Active" : "🔴 Closed"}
                  </span>
                </div>

                <p style={styles.amountLine}>
                  Your contribution:{" "}
                  <strong>
                    {web3 ? web3.utils.fromWei(d.amount, "ether") : "?"} ETH
                  </strong>
                </p>

                <FundingProgress
                  raised={BigInt(d.montantCollecte || 0).toString()}
                  goal={d.objectif}
                  isFunded={d.funded}
                  isWei={true}
                />

                <button
                  onClick={() => navigate(`/donate/${d.projectId}`)}
                  style={styles.viewBtn}
                >
                  View Project →
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page:    { maxWidth: 720, margin: "0 auto", padding: "24px 16px" },
  heading: { margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#1e293b" },
  sub:     { fontSize: 13, color: "#64748b", marginBottom: 24 },
  addr:    { backgroundColor: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontSize: 11 },
  summary: {
    display: "flex", gap: 24, marginBottom: 20,
    padding: "12px 16px", backgroundColor: "#f8fafc",
    borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#334155",
  },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  card: {
    border: "1px solid #e2e8f0", borderRadius: 10, padding: 20,
    backgroundColor: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  cardHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle:   { margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" },
  badge:       { fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99 },
  amountLine:  { fontSize: 14, color: "#475569", margin: "0 0 12px" },
  viewBtn: {
    marginTop: 14, background: "none",
    border: "1px solid #6366f1", color: "#6366f1",
    padding: "6px 14px", borderRadius: 7,
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  empty: { textAlign: "center", padding: "48px 0", color: "#64748b" },
  cta: {
    marginTop: 12, padding: "10px 20px",
    backgroundColor: "#6366f1", color: "#fff",
    border: "none", borderRadius: 8,
    fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  info: { padding: 40, textAlign: "center", color: "#64748b" },
  err:  { padding: 40, textAlign: "center", color: "#dc2626" },
};
