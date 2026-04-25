/**
 * src/App.jsx
 *
 * Shared routing file — BOTH Person A and Person B contribute here.
 *
 * Person A owns:    /create, /projects, /project/:id, /admin
 * Person B owns:    /donate/:projectId, /my-donations, /funded
 * Shared:           / (redirects to /projects)
 *
 * ⚠️  This file requires react-router-dom v6.
 *     Run:  npm install react-router-dom web3
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";

// ── Person A's pages (stubs if not yet implemented by Person A) ──────────────
// Replace these lazy imports with actual imports once Person A provides the files
const CreateProject  = React.lazy(() => import("./pages/CreateProject"));
const ProjectList    = React.lazy(() => import("./pages/ProjectList"));
const ProjectDetail  = React.lazy(() => import("./pages/ProjectDetail"));
const AdminPanel     = React.lazy(() => import("./pages/AdminPanel"));

// ── Person B's pages ──────────────────────────────────────────────────────────
const DonatePage     = React.lazy(() => import("./pages/DonatePage"));
const MyDonations    = React.lazy(() => import("./pages/MyDonations"));
const FundedProjects = React.lazy(() => import("./pages/FundedProjects"));

export default function App() {
  return (
    <BrowserRouter>
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav style={styles.nav}>
        <span style={styles.brand}>🎓 MicroDons</span>
        <div style={styles.links}>
          {/* Person A */}
          <NavLink to="/projects"    style={navStyle}>Projects</NavLink>
          <NavLink to="/create"      style={navStyle}>Create</NavLink>
          <NavLink to="/admin"       style={navStyle}>Admin</NavLink>
          {/* Person B */}
          <NavLink to="/my-donations" style={navStyle}>My Donations</NavLink>
          <NavLink to="/funded"       style={navStyle}>Funded</NavLink>
        </div>
      </nav>

      {/* ── Routes ───────────────────────────────────────────────────────── */}
      <main style={styles.main}>
        <React.Suspense fallback={<p style={{ padding: 40, textAlign: "center" }}>🔄 Loading page...</p>}>
          <Routes>
            {/* Default */}
            <Route path="/" element={<Navigate to="/projects" replace />} />

            {/* Person A */}
            <Route path="/projects"        element={<ProjectList />} />
            <Route path="/create"          element={<CreateProject />} />
            <Route path="/project/:id"     element={<ProjectDetail />} />
            <Route path="/admin"           element={<AdminPanel />} />

            {/* Person B */}
            <Route path="/donate/:projectId" element={<DonatePage />} />
            <Route path="/my-donations"      element={<MyDonations />} />
            <Route path="/funded"            element={<FundedProjects />} />

            {/* 404 */}
            <Route path="*" element={<p style={{ padding: 40, textAlign: "center" }}>404 — Page not found</p>} />
          </Routes>
        </React.Suspense>
      </main>
    </BrowserRouter>
  );
}

const navStyle = ({ isActive }) => ({
  color: isActive ? "#6366f1" : "#475569",
  textDecoration: "none",
  fontWeight: isActive ? 700 : 500,
  fontSize: 14,
  padding: "4px 2px",
  borderBottom: isActive ? "2px solid #6366f1" : "2px solid transparent",
});

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  brand: {
    fontWeight: 800,
    fontSize: 18,
    color: "#1e293b",
    letterSpacing: "-0.5px",
  },
  links: {
    display: "flex",
    gap: 24,
  },
  main: {
    minHeight: "calc(100vh - 57px)",
    backgroundColor: "#f8fafc",
  },
};
