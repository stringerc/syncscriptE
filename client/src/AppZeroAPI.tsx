import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPageZeroAPI } from '@/pages/DashboardPageZeroAPI';
import { ThemeProvider } from '@/contexts/ThemeContext';

function AppZeroAPI() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Navigate to="/zero-api" replace />} />
            <Route path="/zero-api" element={<DashboardPageZeroAPI />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default AppZeroAPI;
