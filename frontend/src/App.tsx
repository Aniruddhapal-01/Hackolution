import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import EvaluationPage from "./pages/EvaluationPage";
import StressTestPage from "./pages/StressTestPage";
import DatasetsPage from "./pages/DatasetsPage";
import ReportPage from "./pages/ReportPage";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/"                                  element={<LandingPage />} />
        <Route path="/evaluations"                       element={<DashboardPage />} />
        <Route path="/evaluations/:id"                   element={<EvaluationPage />} />
        <Route path="/evaluations/:id/stress"            element={<StressTestPage />} />
        <Route path="/evaluations/:id/datasets"          element={<DatasetsPage />} />
        <Route path="/evaluations/:id/report"            element={<ReportPage />} />
        {/* Legacy redirects */}
        <Route path="/projects"                          element={<Navigate to="/evaluations" replace />} />
        <Route path="/projects/:id"                      element={<Navigate to="/evaluations" replace />} />
        <Route path="*"                                  element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
