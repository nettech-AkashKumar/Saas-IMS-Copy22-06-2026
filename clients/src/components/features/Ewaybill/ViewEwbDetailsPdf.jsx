import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../../pages/config/axiosInstance.js";

export default function ViewEwbDetailsPdf({ billData, onClose }) {
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    compileAndOpenPdf();
  }, []);

  const compileAndOpenPdf = async () => {
    try {
      const tenantDb = localStorage.getItem("dbName") || "";
      // Hits router.get("/details/:ewayBillNo", getEWBDetailsController)
      const response = await api.get(`/api/ewaybill/details/${billData.ewayBillNo}`, {
        headers: { "x-tenant-db": tenantDb }
      });

      const data = response.data?.data || billData;

      // Construct client canvas document stream view
      const doc = new jsPDF();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("STATUTORY NATIONAL E-WAY BILL SYSTEM", 12, 10);

      autoTable(doc, {
        startY: 25,
        theme: "striped",
        body: [
          ["E-Way Bill Number Reference:", data.ewayBillNo || "N/A"],
          ["Linked Invoice No Reference:", data.invoiceNo || "-"],
          ["Consignor / Consignee GSTIN:", `${data.userGstin || "-"} / ${data.customerGSTIN || "-"}`],
          ["Assigned Transporter Vehicle No:", String(data.vehicleNo || "N/A").toUpperCase()],
          ["Consignment Evaluation Value:", `INR ${Number(data.totalValue || 0).toLocaleString("en-IN")}/-`],
          ["Current Document Node Status:", data.status || "GENERATED"]
        ],
        styles: { fontSize: 10, cellPadding: 4 }
      });

      window.open(doc.output("bloburl"), "_blank");
    } catch (err) {
      console.error("PDF generation failure: ", err);
    } finally {
      setFetching(false);
      onClose(); // Automatically unmount modal shell frame safely
    }
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-25 shadow-sm">
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content text-center p-4">
          <div className="spinner-border text-primary mx-auto mb-3" role="status" />
          <p className="m-0 text-muted fw-medium" style={{ fontSize: "13px" }}>Structuring layout vectors...</p>
        </div>
      </div>
    </div>
  );
}