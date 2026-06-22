import React from "react";
import company_logo from "../../../assets/images/kasper-logo.png"
import coin from "../../../assets/images/Coin.png"

const ThermalPrintInvoice = ({ template, companyData, products, customer, notesTermsSettings = {}, }) => {
  // Default template if none provided
  const defaultTemplate = {
    showDate: true,
    showTime: true,
    showHSN: true,
    showTax: true,
    showPaymentMode: true,
    showDueAmount: true,
    showRewardEarned: true,
    showGreetings: true
  };

  const templateSettings = template || defaultTemplate;

  // Format date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-GB');
  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

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
        dueAmount: 0
      };
    }

    const subtotal = products.reduce((sum, product) =>
      sum + (product.sellingPrice || 0), 0
    );

    const tax = subtotal * 0.18; // 18% tax
    const total = subtotal + tax;

    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: "0.00",
      points: 17,
      additionalCharges: "100.00",
      total: total.toFixed(2),
      dueAmount: "0.00"
    };
  };

  const totals = calculateTotals();

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
    <div className="dashboard" style={{
      background: "#f5f5f5",
      display: "flex",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Courier New', Courier, monospace",
      height: "100%",
      overflow: "auto"
    }}>
      {/* 58mm Thermal Receipt (280px ≈ 80mm at 90dpi) */}
      <div
        style={{
          width: "380px",
          background: "white",
          padding: "16px 12px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
          borderRadius: "0px",
          fontSize: "10px",
          lineHeight: "1.4",
          color: "#000",
          overflow: "auto"
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <img src={companyData?.companyLogo} alt="company_logo" style={{ maxWidth: "150px", maxHeight: "50px", objectFit: "contain" }} />
        </div>

        {/* Company Info */}
        <div style={{ textAlign: "center", fontSize: "11px", marginBottom: "12px" }}>
          <div style={{ fontWeight: "bold" }}>{companyData?.companyName || "Kasper Clothing"}</div>
          <div>{companyData?.companyaddress || "Ithum Tower B-214, Noida (UP) - 201301"}</div>
          <div>Phone No: {companyData?.companyphone || "98547 25148"}</div>
          <div>Email: {companyData?.companyemail || "Customercare@dummy.com"}</div>
          <div>GSTIN No. - {companyData?.gstin || "2316445GAF5KA1S"}</div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "12px", margin: "8px 0" }}>
          Tax Invoice
        </div>

        {/* Date & Time */}
        {(templateSettings.showDate || templateSettings.showTime) && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
            {templateSettings.showDate && <span>Date: {formattedDate}</span>}
            {templateSettings.showTime && <span>Time: {formattedTime}</span>}
          </div>
        )}

        <div style={{ borderTop: "1px dashed #000", margin: "10px 0" }} />

        {/* Table Header */}
        <div style={{ display: "flex", fontWeight: "bold", marginBottom: "6px" }}>
          <div style={{ width: "50%" }}>ITEM</div>
          <div style={{ width: "15%", textAlign: "center" }}>QTY/</div>
          <div style={{ width: "18%", textAlign: "right" }}>PRICE</div>
          <div style={{ width: "17%", textAlign: "right" }}>AMOUNT</div>
        </div>

        {templateSettings.showHSN && (
          <div style={{ display: "flex", fontSize: "9px", marginBottom: "8px" }}>
            <div style={{ width: "50%" }}>HSN/SAC</div>
            <div style={{ width: "15%", textAlign: "center" }}>UNIT</div>
            <div style={{ width: "18%", textAlign: "center" }}>(INR)</div>
            <div style={{ width: "17%", textAlign: "center" }}>(INR)</div>
          </div>
        )}

        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

        {/* Items */}
        {products && products.length > 0 ? (
          products.map((product, i) => (
            <div key={i} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: "50%", fontWeight: "bold" }}>{product.productName || product.name}</div>
                <div style={{ width: "15%", textAlign: "center" }}>1/pcs</div>
                <div style={{ width: "18%", textAlign: "right" }}>{product.sellingPrice?.toFixed(2) || "0.00"}</div>
                <div style={{ width: "17%", textAlign: "right" }}>{((product.sellingPrice || 0) * 1.18).toFixed(2)}</div>
              </div>
              {templateSettings.showHSN && (
                <div style={{ fontSize: "9px", marginTop: "4px", marginLeft: "4px" }}>
                  <div>HSN/SAC: {product.hsn?.hsnCode || product.hsnCode || "215458754"}</div>
                  {templateSettings.showTax && (
                    <>
                      <div>Taxable Value: {(product.sellingPrice || 0).toFixed(2)}</div>
                      <div>GST 18%: {((product.sellingPrice || 0) * 0.18).toFixed(2)}</div>
                    </>
                  )}
                </div>
              )}
              {i === 0 && <div style={{ borderTop: "1px dashed #ccc", margin: "10px 0 6px" }} />}
            </div>
          ))
        ) : (
          <div style={{ marginBottom: "14px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ width: "50%", fontWeight: "bold" }}>Sample Product</div>
              <div style={{ width: "15%", textAlign: "center" }}>1/pcs</div>
              <div style={{ width: "18%", textAlign: "right" }}>1000.00</div>
              <div style={{ width: "17%", textAlign: "right" }}>1180.00</div>
            </div>
            {templateSettings.showHSN && (
              <div style={{ fontSize: "9px", marginTop: "4px", marginLeft: "4px" }}>
                <div>HSN/SAC: 215458754</div>
                {templateSettings.showTax && (
                  <>
                    <div>Taxable Value: 1000.00</div>
                    <div>GST 18%: 180.00</div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: "1px dashed #000", margin: "12px 0" }} />

        {/* Total Summary */}
        <div style={{ fontSize: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Total</span>
            <span style={{ fontWeight: "bold" }}>₹{totals.subtotal}</span>
          </div>
          {templateSettings.showTax && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Taxable value</span>
                <span>₹{totals.subtotal}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>CGST</span>
                <span>₹{(parseFloat(totals.tax) / 2).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>SGST/UTGST</span>
                <span>₹{(parseFloat(totals.tax) / 2).toFixed(2)}</span>
              </div>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
            <span>Total Amount</span>
            <span>₹{totals.total}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ borderBottom: "1px dashed #000" }}>Packaging Charges</span>
            <span style={{ borderBottom: "1px dashed #000" }}>₹{totals.additionalCharges}</span>
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            fontWeight: "bold",
            paddingTop: "8px",
            marginTop: "8px"
          }}>
            <span>Grand Total</span>
            <span>₹{(parseFloat(totals.total) + parseFloat(totals.additionalCharges)).toFixed(2)}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "12px 0" }} />

        {/* Payment Info */}
        {(templateSettings.showPaymentMode || templateSettings.showDueAmount) && (
          <div style={{ fontSize: "10px", margin: "10px 0" }}>
            {templateSettings.showPaymentMode && <div>Payment Mode: Cash</div>}
            {templateSettings.showDueAmount && <div>Due Amount: ₹{totals.dueAmount}/-</div>}
          </div>
        )}

        <div style={{ borderTop: "1px dashed #000" }}></div>

        {/* Points */}
        {templateSettings.showRewardEarned && (
          <div style={{ textAlign: "center", margin: "14px 0" }}>
            <div style={{ fontSize: "11px" }}>
              {notesTermsSettings?.loyaltyMessage ? (
                renderTextWithLineBreaks(notesTermsSettings.loyaltyMessage)
              ) : (
                <>
                  Earned <span style={{ fontSize: "16px" }}><img style={{ width: "15px" }} src={coin} alt="" /></span> {totals.points} Shopping Point on this purchase.
                  <div style={{ fontSize: "10px", marginTop: "4px" }}>
                    Redeem on your next purchase.
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Signature Section for Thermal */}
        {templateSettings.signatureUrl && (
          <div style={{ textAlign: "center", margin: "10px 0", padding: "10px 0", borderTop: "1px dashed #000" }}>
            <div style={{ fontSize: "10px", marginBottom: "5px" }}>Signature</div>
            <img
              src={templateSettings.signatureUrl}
              alt="Signature"
              style={{
                maxWidth: "100px",
                maxHeight: "40px",
                objectFit: "contain"
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                // Show text if image fails
                e.target.parentElement.innerHTML = `
          <div style="font-size: 10px; margin-bottom: 5px">Signature</div>
          <div style="border-top: 1px solid #000; width: 80px; margin: 0 auto; padding-top: 3px"></div>
        `;
              }}
            />
          </div>
        )}

        <div style={{ borderTop: "1px dashed #000", margin: "12px 0" }} />

        {/* Footer Lines */}
        {(notesTermsSettings?.footerLine1 || notesTermsSettings?.footerLine2) && (
          <div style={{ textAlign: "center", margin: "8px 0", fontSize: "10px" }}>
            {notesTermsSettings?.footerLine1 && (
              <div style={{ marginBottom: "4px" }}>{notesTermsSettings.footerLine1}</div>
            )}
            {notesTermsSettings?.footerLine2 && (
              <div>{notesTermsSettings.footerLine2}</div>

            )}
            <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }}></div>
          </div>
        )}

        {/* Footer */}
        {templateSettings.showGreetings && (
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <div style={{ fontSize: "11px" }}>Thanks for visiting {companyData?.companyName || "Kasper Clothing"}</div>
            <div style={{ fontWeight: "bold", marginTop: "8px" }}>HAVE A NICE DAY</div>
          </div>
        )}

        <div style={{ borderTop: "1px dashed #000" }}></div>
      </div>
    </div>
  );
};

export default ThermalPrintInvoice;