import React from "react";

export default function KPIWidget({ title, value, change }) {
  return (
    <div className="kpi-widget p-3 rounded bg-white shadow-sm">
      <small className="text-muted">{title}</small>
      <div className="d-flex align-items-end justify-content-between mt-2">
        <div>
          <h4 className="m-0">{value}</h4>
          <small className="text-success">{change}</small>
        </div>
        <div className="kpi-sparkline" aria-hidden="true">
          ▁▂▇█▆▅
        </div>
      </div>
    </div>
  );
}
