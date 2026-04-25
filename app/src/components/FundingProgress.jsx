/**
 * components/FundingProgress.jsx
 *
 * Displays a visual funding progress bar for a project.
 * Accepts both on-chain data (from Project.sol) and locally
 * tracked amounts (from Donation.sol).
 *
 * Props:
 *  - raised        {string|number}  Total ETH raised (in Wei or ETH string)
 *  - goal          {string|number}  Funding goal (same unit as raised)
 *  - isFunded      {boolean}        Whether the project has crossed threshold
 *  - isWei         {boolean}        If true, values are in Wei (default: false, values in ETH)
 */

import React, { useMemo } from "react";

export default function FundingProgress({
  raised = 0,
  goal = 1,
  isFunded = false,
  isWei = false,
}) {
  const { raisedEth, goalEth, pct, displayPct } = useMemo(() => {
    const r = isWei
      ? parseFloat(raised) / 1e18
      : parseFloat(raised) || 0;
    const g = isWei
      ? parseFloat(goal) / 1e18
      : parseFloat(goal) || 1;
    const raw = g > 0 ? (r / g) * 100 : 0;
    const capped = Math.min(raw, 100);
    return {
      raisedEth: r.toFixed(4),
      goalEth: g.toFixed(4),
      pct: capped,
      displayPct: capped.toFixed(1),
    };
  }, [raised, goal, isWei]);

  // Color transitions: red → yellow → green
  const barColor = isFunded
    ? "#22c55e"
    : pct >= 75
    ? "#84cc16"
    : pct >= 40
    ? "#eab308"
    : "#f97316";

  return (
    <div style={styles.wrapper}>
      {/* Label row */}
      <div style={styles.labelRow}>
        <span style={styles.raised}>
          ⬆ {raisedEth} ETH raised
        </span>
        <span style={styles.goal}>Goal: {goalEth} ETH</span>
      </div>

      {/* Progress track */}
      <div style={styles.track} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          style={{
            ...styles.fill,
            width: `${pct}%`,
            backgroundColor: barColor,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Percentage + status badge */}
      <div style={styles.footRow}>
        <span style={styles.pctLabel}>{displayPct}%</span>
        {isFunded ? (
          <span style={{ ...styles.badge, backgroundColor: "#dcfce7", color: "#15803d" }}>
            ✅ Funded
          </span>
        ) : (
          <span style={{ ...styles.badge, backgroundColor: "#fef9c3", color: "#854d0e" }}>
            🔄 In Progress
          </span>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    fontFamily: "inherit",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 13,
  },
  raised: {
    fontWeight: 600,
    color: "#1e293b",
  },
  goal: {
    color: "#64748b",
  },
  track: {
    width: "100%",
    height: 12,
    backgroundColor: "#e2e8f0",
    borderRadius: 99,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 99,
  },
  footRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  pctLabel: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 500,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 99,
  },
};
