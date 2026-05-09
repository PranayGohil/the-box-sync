import React from "react";
import { Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserDetails from "./pages/UserDetails";
import Inquiries from "./pages/Inquiries";

import AdminManagement from "./pages/AdminManagement";
import AdminTimeline from "./pages/AdminTimeline";
import ActivityTimeline from "./pages/ActivityTimeline";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/userdetails/:id" element={<UserDetails />} />
        <Route path="/inquiries" element={<Inquiries />} />
        <Route path="/admins" element={<AdminManagement />} />
        <Route path="/admins/:id/timeline" element={<AdminTimeline />} />
        <Route path="/timeline" element={<ActivityTimeline />} />
      </Routes>
    </Layout>
  );
}

export default App;
