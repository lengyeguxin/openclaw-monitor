import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import AgentsPage from './pages/AgentsPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import { Sidebar } from './components/layout.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Sidebar>
              <Dashboard />
            </Sidebar>
          }
        />
        <Route
          path="/agents"
          element={
            <Sidebar>
              <AgentsPage />
            </Sidebar>
          }
        />
        <Route
          path="/projects"
          element={
            <Sidebar>
              <ProjectsPage />
            </Sidebar>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <Sidebar>
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
