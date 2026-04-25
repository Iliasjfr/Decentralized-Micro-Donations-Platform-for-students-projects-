/**
 * components/DonationForm.jsx
 *
 * Reusable donation form. Calls Donation.sol's donate(projectId) with ETH value.
 *
 * Props:
 *  - projectId       {number}    The project to donate to
 *  - donationContract {object}   Web3 contract instance (from useContract)
 *  - account          {string}   Connected MetaMask account
 *  - web3             {object}   Web3 instance (for toWei)
 *  - onSuccess        {function} Called after successful donation tx
 */

import React, { useState } from "react";

export default function DonationForm({
  projectId,
  donationContract,
  account,
  web3,
  onSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState(null); // null | "pending" | "success" | "error"
  const [txHash, setTxHash] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const handleDonate = async () => {
    if (!donationContract || !account || !web3) {
      setErrMsg("Wallet not connected.");
      setStatus("error");
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setErrMsg("Please enter a valid ETH amount greater than 0.");
      setStatus("error");
      return;
    }

    setStatus("pending");
    setErrMsg("");
    setTxHash("");

    try {
      const weiValue = web3.utils.toWei(amount, "ether");

      const tx = await donationContract.methods
        .donate(projectId)
        .send({ from: account, value: weiValue });

      setTxHash(tx.transactionHash);
      setStatus("success");
      setAmount("");
      if (onSuccess) onSuccess(tx);
    } catch (err) {
      console.error("Donation error:", err);
      // Surface friendly message from revert strings if available
      const msg =
        err?.data?.message ||
        err?.message ||
        "Transaction failed. Check MetaMask.";
      setErrMsg(msg);
      setStatus("error");
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>💰 Donate to this Project</h3>

      <div style={styles.row}>
        <input
          type="number"
          min="0"
          step="0.001"
          placeholder="Amount in ETH (e.g. 0.05)"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setStatus(null);
          }}
          style={styles.input}
          disabled={status === "pending"}
        />
        <button
          onClick={handleDonate}
          disabled={status === "pending" || !donationContract}
          style={{
            ...styles.btn,
            opacity: status === "pending" ? 0.6 : 1,
          }}
        >
          {status === "pending" ? "⏳ Confirming..." : "Donate"}
        </button>
      </div>

      {status === "success" && (
        <div style={styles.success}>
          ✅ Donation sent!{" "}
          {txHash && (
            <span style={styles.hash}>
              Tx: {txHash.slice(0, 10)}...{txHash.slice(-6)}
            </span>
          )}
        </div>
      )}

      {status === "error" && (
        <div style={styles.error}>❌ {errMsg}</div>
      )}
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "18px 20px",
    backgroundColor: "#f8fafc",
    maxWidth: 480,
  },
  title: {
    margin: "0 0 14px",
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
  },
  row: {
    display: "flex",
    gap: 10,
  },
  input: {
    flex: 1,
    padding: "9px 12px",
    borderRadius: 7,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    outline: "none",
  },
  btn: {
    padding: "9px 18px",
    backgroundColor: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  success: {
    marginTop: 12,
    color: "#15803d",
    fontSize: 13,
    fontWeight: 500,
  },
  error: {
    marginTop: 12,
    color: "#b91c1c",
    fontSize: 13,
  },
  hash: {
    fontFamily: "monospace",
    backgroundColor: "#dcfce7",
    padding: "1px 6px",
    borderRadius: 4,
    marginLeft: 6,
  },
};
