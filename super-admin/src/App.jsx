import React from "react";
import { Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import Header from "./components/Header";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserDetails from "./pages/UserDetails";
import Inquiries from "./pages/Inquiries";

function App() {
  

  return (
    <>
      <Header />
      <div className="container" style={{ marginTop: "100px" }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/userdetails/:id" element={<UserDetails />} />
        <Route path="/inquiries" element={<Inquiries />} />
      </Routes>
      </div>
    </>
  );
}

export default App;
