import React from "react";
import TaxInvoiceLogo from "../../../assets/images/taxinvoice.png";
import Qrcode from "../../../assets/images/qrcode.png";

// Remove useState and useEffect imports since we don't need them
// import { useState, useEffect } from "react"; // REMOVE THIS

function NormalPrintInvoice({
  template,
  companyData,
  products,
  customer,
  notesTermsSettings = {}, // This is coming from props
}) {

  // Default template if none provided
  const defaultTemplate = {
    showHSN: true,
    showRate: true,
    showTax: true,
    showTotalsInWords: true,
    showBankDetails: true,
    showTermsConditions: true,
  };

  const templateSettings = template || defaultTemplate;

  // Format date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-GB");

  // Calculate totals
  const calculateTotals = () => {
    if (!products || products.length === 0) {
      return {
        subtotal: 0,
        tax: 0,
        discount: 0,
        points: 17,
        additionalCharges: 0,
        total: 0,
        dueAmount: 0,
      };
    }

    const subtotal = products.reduce(
      (sum, product) => sum + (product.sellingPrice || 0),
      0
    );

    const tax = subtotal * 0.18; // 18% tax
    const total = subtotal + tax;

    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: "0.00",
      points: 17,
      additionalCharges: "0.00",
      total: total.toFixed(2),
      dueAmount: "0.00",
    };
  };

  const totals = calculateTotals();

  // Convert total to words
  const numberToWords = (num) => {
    const numInt = Math.floor(num);
    if (numInt === 0) return "Zero";
    if (numInt <= 999) {
      const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
      ];
      const teens = [
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
      ];
      const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
      ];

      if (numInt < 10) return ones[numInt];
      if (numInt < 20) return teens[numInt - 10];
      if (numInt < 100)
        return (
          tens[Math.floor(numInt / 10)] +
          (numInt % 10 !== 0 ? " " + ones[numInt % 10] : "")
        );
      if (numInt < 1000) {
        const hundred = ones[Math.floor(numInt / 100)] + " Hundred";
        const remainder = numInt % 100;
        if (remainder === 0) return hundred;
        return hundred + " and " + numberToWords(remainder);
      }
    }
    return "Five Hundred Sixty"; // Fallback
  };

  const totalInWords =
    numberToWords(Math.floor(parseFloat(totals.total))) + " Only";

  // Get bank details from company data
  const bankDetails = {
    bankName: "ICICI Bank",
    branch: "Noida, Sector 62",
    accountNumber: "278415630109014",
    ifscCode: "ICINO512345",
    upiId: "abc@ybl",
  };

  // Helper function to render text with line breaks
  const renderTextWithLineBreaks = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div
      className="p-4"
      style={{
        height: "calc(100vh - 70px)",
        overflow: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "0px",
          borderRadius: "16px",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: "100px",
          display: "flex",
          height: "87vh",
        }}
      >
        {/* Left Side */}
        <div
          style={{
            width: "95%",
            // height: "100%",
            paddingTop: 30,
            paddingBottom: 36.37,
            paddingLeft: 36.37,
            paddingRight: 36.37,
            position: "relative",
            background: "#F3F5F6",
            boxShadow:
              "-0.7576505541801453px -0.7576505541801453px 0.6818854808807373px rgba(0, 0, 0, 0.10) inset",
            borderRadius: 12.12,
            outline: "0.76px var(--White-Stroke, #EAEAEA) solid",
            outlineOffset: "-0.76px",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            // gap: 18.18,
            display: "inline-flex",
          }}
        >
          <div
            style={{
              width: "100%",
              position: "relative",
              overflow: "auto",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                left: 0,
                top: 0,
                background: "var(--White-White-1, white)",
                boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
                padding: "10px 15px",
                fontSize: "8px",
                fontFamily: "IBM Plex Mono",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ width: "100px" }}>
                  {/* Company logo would go here */}
                  <div
                    style={{
                      width: "100%",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={companyData.companyLogo || "Company Logo"}
                      alt="companylogo"
                      style={{ objectFit: "contain", height: "40px" }}
                    />
                  </div>

                </div>

                <div style={{ width: "130px" }}>
                  <img
                    src={TaxInvoiceLogo}
                    alt="tax invoice"
                    style={{ width: "100%", objectFit: "contain" }}
                  />
                </div>

              </div>
              <div
                style={{
                  width: "100%",
                  height: 0.76,
                  left: 31.77,
                  background: "var(--White-Stroke, #EAEAEA)",
                  marginTop: "8px",
                }}
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "2px",
                }}
              >
                <span>INVOICE Date - {formattedDate}</span>
                <span style={{ marginRight: "12px" }}>
                  INVOICE No. - INV-001
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 0.76,
                  left: 31.77,
                  marginTop: "1px",
                  background: "var(--White-Stroke, #EAEAEA)",
                }}
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-around",
                  marginTop: "2px",
                  alignItems: "center",
                  borderBottom: "1px solid #EAEAEA",
                }}
              >
                <div
                  style={{
                    borderRight: "1px solid #EAEAEA",
                    width: "50%",
                    textAlign: "center",
                  }}
                >
                  <span>From</span>
                </div>
                <div style={{ width: "50%", textAlign: "center" }}>
                  <span>Customer Details</span>
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-around",
                  marginTop: "2px",
                  alignItems: "center",
                  borderBottom: "1px solid #EAEAEA",
                }}
              >
                <div
                  style={{
                    borderRight: "1px solid #EAEAEA",
                    width: "50%",
                    padding: "3px",
                  }}
                >
                  <div>
                    Name:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                      {companyData?.companyName || "Kasper Infotech Pvt. Ltd."}
                    </span>
                  </div>
                  <div>Address: {companyData?.companyaddress || ""}</div>
                  <div style={{ marginTop: "0px" }}>
                    Phone: {companyData?.companyphone || ""}
                  </div>
                  <div>Email: {companyData?.companyemail || ""}</div>
                  <div>GSTIN: {companyData?.gstin || ""}</div>
                </div>
                <div style={{ width: "50%", padding: "3px" }}>
                  <div>
                    Name:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                      {customer?.name ||
                        customer?.customerName ||
                        "Alok Ranjan"}
                    </span>
                  </div>
                  <div>
                    Address:{" "}
                    {customer?.address || customer?.customerAddress || ""}
                  </div>
                  <div style={{ marginTop: "0px" }}>
                    Phone: {customer?.phone || customer?.customerPhone || ""}
                  </div>
                  <div>
                    Email: {customer?.email || customer?.customerEmail || ""}
                  </div>
                  <div>GSTIN: {customer?.gstin || ""}</div>
                </div>
              </div>
              <div className="table-responsive mt-3">
                <table
                  className=""
                  style={{
                    width: "100%",
                    border: "1px solid #EAEAEA",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead style={{ textAlign: "center" }}>
                    <tr>
                      <th
                        style={{
                          borderRight: "1px solid #EAEAEA",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                        rowSpan="2"
                      >
                        Sr No.
                      </th>
                      <th
                        style={{
                          borderRight: "1px solid #EAEAEA",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                        rowSpan="2"
                      >
                        Name of the Products
                      </th>
                      {templateSettings.showHSN && (
                        <th
                          style={{
                            borderRight: "1px solid #EAEAEA",
                            borderBottom: "1px solid #EAEAEA",
                          }}
                          rowSpan="2"
                        >
                          HSN
                        </th>
                      )}
                      <th
                        style={{
                          borderRight: "1px solid #EAEAEA",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                        rowSpan="2"
                      >
                        QTY
                      </th>
                      {templateSettings.showRate && (
                        <th
                          style={{
                            borderRight: "1px solid #EAEAEA",
                            borderBottom: "1px solid #EAEAEA",
                          }}
                          rowSpan="2"
                        >
                          Rate
                        </th>
                      )}
                      {templateSettings.showTax && (
                        <th
                          style={{
                            borderRight: "1px solid #EAEAEA",
                            borderBottom: "1px solid #EAEAEA",
                          }}
                          colSpan="2"
                        >
                          Tax
                        </th>
                      )}
                      <th
                        style={{
                          borderRight: "1px solid #EAEAEA",
                          borderBottom: "1px solid #EAEAEA",
                        }}
                        rowSpan="2"
                      >
                        Total
                      </th>
                    </tr>
                    {templateSettings.showTax && (
                      <tr>
                        <th
                          style={{
                            borderRight: "1px solid #EAEAEA",
                            borderBottom: "1px solid #EAEAEA",
                          }}
                        >
                          %
                        </th>
                        <th
                          style={{
                            borderRight: "1px solid #EAEAEA",
                            borderBottom: "1px solid #EAEAEA",
                          }}
                        >
                          Amount
                        </th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {products && products.length > 0 ? (
                      products.map((product, index) => (
                        <tr key={index}>
                          <td
                            style={{
                              borderRight: "1px solid #EAEAEA",
                              padding: "4px",
                              textAlign: "center",
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              borderRight: "1px solid #EAEAEA",
                              padding: "4px",
                            }}
                          >
                            {product.productName || product.name}
                          </td>
                          {templateSettings.showHSN && (
                            <td
                              style={{
                                borderRight: "1px solid #EAEAEA",
                                padding: "4px",
                                textAlign: "center",
                              }}
                            >
                              {product.hsn?.hsnCode || product.hsnCode || "-"}
                            </td>
                          )}
                          <td
                            style={{
                              borderRight: "1px solid #EAEAEA",
                              padding: "4px",
                              textAlign: "center",
                            }}
                          >
                            1 pcs
                          </td>
                          {templateSettings.showRate && (
                            <td
                              style={{
                                borderRight: "1px solid #EAEAEA",
                                padding: "4px",
                                textAlign: "right",
                              }}
                            >
                              ₹{product.sellingPrice?.toFixed(2) || "0.00"}
                            </td>
                          )}
                          {templateSettings.showTax && (
                            <>
                              <td
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  padding: "4px",
                                  textAlign: "center",
                                }}
                              >
                                18%
                              </td>
                              <td
                                style={{
                                  borderRight: "1px solid #EAEAEA",
                                  padding: "4px",
                                  textAlign: "right",
                                }}
                              >
                                ₹
                                {((product.sellingPrice || 0) * 0.18).toFixed(
                                  2
                                )}
                              </td>
                            </>
                          )}
                          <td
                            style={{
                              borderRight: "1px solid #EAEAEA",
                              padding: "4px",
                              textAlign: "right",
                            }}
                          >
                            ₹{((product.sellingPrice || 0) * 1.18).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={
                            3 +
                            (templateSettings.showHSN ? 1 : 0) +
                            (templateSettings.showRate ? 1 : 0) +
                            (templateSettings.showTax ? 2 : 0)
                          }
                          style={{
                            padding: "20px",
                            textAlign: "center",
                            border: "1px solid #EAEAEA",
                            height: "220px",
                          }}
                        >
                          No products available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-around",
                  marginTop: "15px",
                  borderTop: "1px solid #EAEAEA",
                  borderBottom: "1px solid #EAEAEA",
                }}
              >
                <div
                  style={{
                    borderRight: "",
                    width: "50%",
                    padding: "3px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {templateSettings.showTotalsInWords && (
                    <>
                      <u>Total in words</u>
                      <div style={{ marginTop: "5px", fontWeight: "600" }}>
                        {totalInWords}
                      </div>
                    </>
                  )}

                  {templateSettings.showBankDetails && (
                    <>
                      <div
                        style={{
                          width: "100%",
                          height: 0.76,
                          left: 31.77,
                          background: "var(--White-Stroke, #EAEAEA)",
                          marginTop: "10px",
                        }}
                      />
                      <div
                        style={{
                          marginTop: "2px",
                          textDecoration: "underline",
                        }}
                      >
                        Bank Details
                      </div>
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0px 5px",
                        }}
                      >
                        <div style={{ textAlign: "left" }}>
                          <div>
                            Bank:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {bankDetails.bankName}
                            </span>
                          </div>
                          <div>
                            Branch:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {bankDetails.branch}
                            </span>
                          </div>
                          <div>
                            Account No.:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {bankDetails.accountNumber}
                            </span>
                          </div>
                          <div>
                            IFSC:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {bankDetails.ifscCode}
                            </span>
                          </div>
                          <div>
                            Upi:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                              {bankDetails.upiId}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ width: "45px", objectFit: "contain" }}>
                            <img
                              src={Qrcode}
                              alt="QR Code"
                              style={{ width: "100%" }}
                            />
                          </div>
                          <div>Pay Using Upi</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div
                  style={{
                    width: "50%",
                    padding: "3px",
                    borderLeft: "1px solid #EAEAEA",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #EAEAEA",
                      padding: "1px 8px",
                    }}
                  >
                    <span>Sub-total</span>
                    <span style={{ color: "black" }}>₹{totals.subtotal}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #EAEAEA",
                      padding: "1px 8px",
                    }}
                  >
                    <span>Tax Amount</span>
                    <span style={{ color: "black" }}>₹{totals.tax}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #EAEAEA",
                      padding: "2px 8px",
                    }}
                  >
                    <span>Discount</span>
                    <span style={{ color: "black" }}>₹{totals.discount}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #EAEAEA",
                      padding: "2px 8px",
                    }}
                  >
                    <span>🪙 Shopping Points</span>
                    <span style={{ color: "black" }}>₹{totals.points}.00</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #EAEAEA",
                      padding: "2px 8px",
                    }}
                  >
                    <span>Additional Charge</span>
                    <span style={{ color: "black" }}>
                      ₹{totals.additionalCharges}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #EAEAEA",
                      padding: "1px 8px",
                    }}
                  >
                    <span style={{ fontWeight: "700", fontSize: "10px" }}>
                      Total
                    </span>
                    <span
                      style={{
                        color: "black",
                        fontWeight: "600",
                        fontSize: "10px",
                      }}
                    >
                      ₹{totals.total}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "2px 8px",
                    }}
                  >
                    <span>Due Amount</span>
                    <span style={{ color: "black" }}>₹{totals.dueAmount}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-around",
                  borderBottom: "1px solid #EAEAEA",
                }}
              >
                <div
                  style={{
                    borderRight: "",
                    width: "50%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {templateSettings.showTermsConditions && (
                    <>
                      <u>Term & Conditions</u>
                      <div
                        style={{
                          marginTop: "5px",
                          fontSize: "7px",
                          textAlign: "center",
                          padding: "0 5px",
                        }}
                      >
                        {/* Use notesTermsSettings prop here */}
                        {notesTermsSettings?.termsText ?
                          renderTextWithLineBreaks(notesTermsSettings.termsText) :
                          'Standard terms and conditions apply.'
                        }
                      </div>
                    </>
                  )}
                </div>

                <div style={{ width: "50%", borderLeft: "1px solid #EAEAEA" }}>

                  {companyData?.signatureUrl ? (
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          padding: "8px",
                        }}
                      >
                        <img
                          src={companyData.signatureUrl}
                          alt="Signature"
                          style={{
                            maxWidth: "100px",
                            maxHeight: "60px",
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                            // Show text signature if image fails to load
                            e.target.parentElement.innerHTML = `
              <div style="border-top: 1px solid #000; width: 150px; padding-top: 5px">
                <div style="font-weight: 500; font-size: 10px">Signature</div>
              </div>
            `;
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          borderTop: "1px solid #EAEAEA",
                          padding: "1px 8px",
                        }}
                      >
                        <span style={{ fontWeight: "500", fontSize: "10px" }}>
                          Signature
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          padding: "8px",
                        }}
                      >
                        <span style={{ color: '#999', fontSize: '16px', marginTop: '0px' }}>Not Set</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          borderTop: "1px solid #EAEAEA",
                          padding: "1px 8px",
                        }}
                      >
                        <div style={{ fontWeight: "500", fontSize: "10px" }}>
                          Signature
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Lines - Use notesTermsSettings prop */}
              <div
                style={{
                  width: "100%",
                  justifyContent: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginTop: "8px",
                }}
              >
                {notesTermsSettings?.footerLine1 && (
                  <div style={{ fontWeight: "600", fontSize: "9px" }}>
                    {notesTermsSettings.footerLine1}
                  </div>
                )}
                {notesTermsSettings?.footerLine2 && (
                  <div style={{ fontSize: "8px", marginTop: "2px" }}>
                    {notesTermsSettings.footerLine2}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NormalPrintInvoice;