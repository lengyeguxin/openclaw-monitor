import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import AgentsPage from './pages/AgentsPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import { Sidebar } from './components/layout.jsx';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange}>
              <Dashboard />
            </Sidebar>
          }
        />
        <Route
          path="/agents"
          element={
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange}>
              <AgentsPage />
            </Sidebar>
          }
        />
        <Route
          path="/projects"
          element={
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange}>
              <ProjectsPage />
            </Sidebar>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange}>
              <ProjectDetailPage />
            </Sidebar>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
