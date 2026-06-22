import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function PrintDeliveryChallan() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/show-delivery-challan/${id}`, { state: { autoPrint: true } });
  }, [id, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default PrintDeliveryChallan;