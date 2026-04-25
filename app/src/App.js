import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProjectList   from "./pages/ProjectList";
import CreateProject from "./pages/CreateProject";
import ProjectDetail from "./pages/ProjectDetail";
import AdminPanel    from "./pages/AdminPanel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<ProjectList />} />
        <Route path="/creer"      element={<CreateProject />} />
        <Route path="/projet/:id" element={<ProjectDetail />} />
        <Route path="/admin"      element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;