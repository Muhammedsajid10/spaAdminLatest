import React from "react";
import { Routes, Route } from "react-router-dom";
import ReportsMain from "@features/reports/ReportsMain";
import GenericReportPage from "@features/reports/GenericReportPage";
import { reportsConfig } from "@features/reports/reportConfigs";

export default function ReportsRoutes() {
  return (
    <Routes>
      <Route index element={<ReportsMain />} />

      {/* Reusable routes using GenericReportPage or custom components */}
      {Object.entries(reportsConfig).map(([key, config]) => (
        <Route
          key={key}
          path={key}
          element={
            config.useCustomComponent ? (
              <config.customComponent />
            ) : (
              <GenericReportPage {...config} />
            )
          }
        />
      ))}
    </Routes>
  );
}
