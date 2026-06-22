import React, { useRef, useEffect, useState } from "react";
import jsPDF from "jspdf";
import { Link, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
import { IoPrintOutline } from "react-icons/io5";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

function AddQrCode() {
  const location = useLocation();
  const cardRefs = useRef({});
  const shelfData = location.state?.barcodeData || [];
  const [qrImages, setQrImages] = useState({});

  useEffect(() => {
    const generateQRCodes = async () => {
      const results = {};
      for (let i = 0; i < shelfData.length; i++) {
        try {
          const url = await QRCode.toDataURL(shelfData[i].barcodeValue, {
            width: 220,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
          });
          results[i] = url;
        } catch (err) {
          console.error("QR generation error for item", i, err);
          results[i] = null;
        }
      }
      setQrImages(results);
    };
    if (shelfData.length > 0) generateQRCodes();
  }, []);

  // ── BULK DOWNLOAD (stitch all cards) ──
  const handleDownload = async () => {
  if (!shelfData.length) return;

  const pdf = new jsPDF("p", "mm", "a4");

  const startX = 10;
  const startY = 10;

  const cardWidth = 90;
  const cardHeight = 85;

  const qrSize = 35;

  const cols = 2;
  const rows = 3;

  const itemsPerPage = cols * rows;

  shelfData.forEach((item, index) => {
    if (index > 0 && index % itemsPerPage === 0) {
      pdf.addPage();
    }

    const position = index % itemsPerPage;

    const col = position % cols;
    const row = Math.floor(position / cols);

    const x = startX + col * cardWidth;
    const y = startY + row * cardHeight;

    // Border
    pdf.rect(x, y, 80, 75);

    // Type
    pdf.setFontSize(12);
    pdf.text(item.type || "", x + 5, y + 8);

    // Name
    pdf.setFontSize(10);
    pdf.text(item.name || "", x + 5, y + 15);

    // QR
    if (qrImages[index]) {
      pdf.addImage(
        qrImages[index],
        "PNG",
        x + 5,
        y + 20,
        qrSize,
        qrSize
      );
    }

    // Barcode
    pdf.setFontSize(8);
    pdf.text(
      String(item.barcodeValue || ""),
      x + 5,
      y + 65
    );
  });

  pdf.save("All-QR-Codes.pdf");
};

  // ── BULK PRINT ──
  const handlePrint = () => {
  if (!shelfData.length) return;

  const printWindow = window.open("", "_blank");

  const cardsHtml = shelfData
    .map(
      (item, index) => `
      <div class="qr-card">
        <div class="type">${item.type || ""}</div>
        <div class="name">${item.name || ""}</div>

        ${
          qrImages[index]
            ? `<img src="${qrImages[index]}" alt="QR" />`
            : ""
        }

        <div class="barcode">
          ${item.barcodeValue || ""}
        </div>
      </div>
    `
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Print QR Codes</title>

        <style>
          body{
            margin:0;
            padding:10px;
            font-family:Arial,sans-serif;
          }

          .container{
            display:grid;
            grid-template-columns:repeat(2,1fr);
            gap:10px;
          }

          .qr-card{
            border:1px solid #ddd;
            padding:8px;
            height:180px;
            page-break-inside:avoid;
          }

          .type{
            font-size:12px;
            font-weight:bold;
          }

          .name{
            font-size:11px;
            margin-top:3px;
            margin-bottom:5px;
          }

          .qr-card img{
            width:80px;
            height:80px;
            display:block;
          }

          .barcode{
            font-size:9px;
            margin-top:5px;
            word-break:break-all;
          }

          @media print {
            @page {
              size:A4;
              margin:8mm;
            }
          }
        </style>
      </head>

      <body>
        <div class="container">
          ${cardsHtml}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 500);
};

  // ── SINGLE DOWNLOAD ──
  const handleSingleDownload = async (index, item) => {
    const pdf = new jsPDF("p", "mm", "a4");

    pdf.setFontSize(22);
    pdf.text(item.type || "", 20, 20);

    pdf.setFontSize(16);
    pdf.text(item.name || "", 20, 35);

    if (qrImages[index]) {
      pdf.addImage(qrImages[index], "PNG", 20, 45, 70, 70);
    }

    pdf.setFontSize(12);
    pdf.text(String(item.barcodeValue || ""), 20, 125);

    pdf.save(`${item.name || item.barcodeValue || "QR-Code"}.pdf`);
  };

  // ── SINGLE PRINT ──
  const handleSinglePrint = (index, item) => {
  const qrSrc = qrImages[index];
  if (!qrSrc) return;

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <html>
      <head>
        <title>${item.name}</title>

        <style>
          body{
            margin:0;
            padding:20px;
            font-family:Arial,sans-serif;
          }

          .card{
            width:250px;
          }

          .type{
            font-size:18px;
            font-weight:bold;
            margin-bottom:4px;
          }

          .name{
            font-size:14px;
            margin-bottom:10px;
          }

          img{
            width:120px;
            height:120px;
            display:block;
          }

          .barcode{
            margin-top:8px;
            font-size:11px;
            word-break:break-all;
          }

          @media print{
            @page{
              size:auto;
              margin:10mm;
            }
          }
        </style>
      </head>

      <body>
        <div class="card">
          <div class="type">${item.type || ""}</div>
          <div class="name">${item.name || ""}</div>

          <img src="${qrSrc}" />

          <div class="barcode">
            ${item.barcodeValue || ""}
          </div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 500);
};

  // ── STYLES ──
  const bulkBtn = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    background: "#FCFCFC",
    borderRadius: 8,
    border: "1px solid #EAEAEA",
    cursor: "pointer",
    fontFamily: "sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "#0E101A",
    height: 40,
    minWidth: 130,
    boxShadow: "0px 4px 4px #1d1b1b4a",
  };

  // Icon-only button for per-card actions
  const iconBtn = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: 34,
    height: 34,
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    cursor: "pointer",
    color: "#374151",
    flexShrink: 0,
  };

  return (
    <div className="p-4" style={{ height: "100vh" }}>
      {/* ── HEADER ── */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 0 16px 0",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <Link
            to={location.state?.from || "/dashboard"}
            style={{
              width: 32,
              height: 32,
              background: "white",
              borderRadius: 53,
              border: "1.07px solid #EAEAEA",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <FaArrowLeft style={{ color: "#A2A8B8" }} />
          </Link>
          <h2
            style={{ margin: 0, color: "black", fontSize: 22, fontWeight: 500 }}
          >
            QR Codes
          </h2>
        </div>

        {/* Bulk buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <button onClick={handleDownload} style={bulkBtn}>
            <MdOutlineFileDownload size={18} /> Download All
          </button>
          <button
            onClick={handlePrint}
            style={{ ...bulkBtn, background: "white" }}
          >
            <IoPrintOutline size={18} /> Print All
          </button>
        </div>
      </div>

      {/* ── CARDS ── */}
      <div
        style={{
          width: "100%",
          padding: 16,
          background: "white",
          borderRadius: 16,
          border: "1px solid #EAEAEA",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          overflowY: "auto",
          maxHeight: "calc(100vh - 140px)",
          marginBottom: 20,
        }}
      >
        {shelfData.map((item, index) => (
          <div
            key={index}
            ref={(el) => (cardRefs.current[index] = el)}
            style={{
              width: "100%",
              padding: 16,
              background: "white",
              borderRadius: 16,
              border: "1px solid #EAEAEA",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* Card top row: labels + icon buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ color: "#1C1C1C", fontSize: 26 }}>
                  {item.type}
                </span>
                <span style={{ color: "#1C1C1C", fontSize: 20 }}>
                  {item.name}
                </span>
              </div>

              {/* ── Icon-only per-card buttons ── */}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => handleSingleDownload(index, item)}
                  style={iconBtn}
                  title="Download this QR"
                >
                  <MdOutlineFileDownload size={18} />
                </button>
                <button
                  onClick={() => handleSinglePrint(index, item)}
                  style={iconBtn}
                  title="Print this QR"
                >
                  <IoPrintOutline size={18} />
                </button>
              </div>
            </div>

            {/* QR image */}
            {qrImages[index] ? (
              <img
                src={qrImages[index]}
                alt="QR Code"
                style={{ width: 220, height: 220, borderRadius: 8 }}
              />
            ) : (
              <div
                style={{
                  width: 220,
                  height: 220,
                  background: "#F3F4F6",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6B7280",
                  fontSize: 14,
                }}
              >
                Generating...
              </div>
            )}

            <span style={{ color: "#6B7280", fontSize: 13 }}>
              {item.barcodeValue}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AddQrCode;
