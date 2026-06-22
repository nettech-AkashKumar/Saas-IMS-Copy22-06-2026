import { useMemo, useState } from 'react';
import { toast } from "react-toastify";
import api from "../config/axiosInstance";

// images
import cash_icon from "../../assets/images/cash-icon.png";
import upi_icon from "../../assets/images/upi-icon.png";
import card_icon from "../../assets/images/card-icon.png";
import split_icon from "../../assets/images/split-icon.png";

const PosReturn = ({ closeModal }) => {
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const refundableAmountForItem = (item) => {
        const totalPrice = Number(item?.totalPrice || 0);
        const discount = Number(item?.discount || 0);
        const tax = Number(item?.tax || 0);
        return Math.max(totalPrice - discount + tax, 0);
    };

    const totalRefundAmount = useMemo(() => {
        if (!sale?.items || selectedItemIds.length === 0) return 0;
        const idSet = new Set(selectedItemIds.map((x) => String(x)));
        return sale.items.reduce((sum, item) => {
            if (!idSet.has(String(item?._id))) return sum;
            return sum + refundableAmountForItem(item);
        }, 0);
    }, [sale, selectedItemIds]);

    const fetchSaleByInvoice = async () => {
        setSuccessMessage("");
        const inv = String(invoiceNumber || "").trim();
        if (!inv) {
            setErrorMessage("Please enter invoice number");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/api/pos-sales/by-invoice/${encodeURIComponent(inv)}`);
            const doc = res?.data?.data || null;
            setErrorMessage("");
            setSale(doc);
            setSelectedItemIds([]);
            setPaymentMethod("");
        } catch (error) {
            setSale(null);
            setSelectedItemIds([]);
            setPaymentMethod("");
            setErrorMessage(error?.response?.data?.message || error?.message || "Failed to fetch invoice");
        } finally {
            setLoading(false);
        }
    };

    const toggleReturnSelection = (saleItem) => {
        const id = String(saleItem?._id || "");
        if (!id) return;
        const currentStatus = String(saleItem?.status || "Sold");
        if (currentStatus === "Return") return;
        setSelectedItemIds((prev) => {
            const arr = Array.isArray(prev) ? prev.map((x) => String(x)) : [];
            if (arr.includes(id)) return arr.filter((x) => x !== id);
            return [...arr, id];
        });
    };

    const completeReturnTransaction = async () => {
        const inv = String(invoiceNumber || "").trim();
        if (!sale?._id) {
            setErrorMessage("Search invoice first");
            return;
        }
        if (selectedItemIds.length === 0) {
            setErrorMessage("Select at least one item to return");
            return;
        }
        if (!paymentMethod) {
            setErrorMessage("Select payment mode");
            return;
        }
        setLoading(true);
        try {
            setErrorMessage("");
            setSuccessMessage("");
            const payload = {
                invoiceNumber: inv,
                paymentMethod,
                itemIds: selectedItemIds,
            };
            const res = await api.post("/api/pos-returns/create", payload);
            if (res?.data?.success) {
                setSuccessMessage("Return transaction completed");
                setTimeout(() => {
                    closeModal();
                }, 2000);
                return;
            }
            setErrorMessage(res?.data?.message || "Failed to complete return");
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || "Failed to complete return";
            const detail = error?.response?.data?.error || "";
            setErrorMessage(detail ? `${msg}: ${detail}` : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={closeModal}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0,0,0,0.27)",
                backdropFilter: "blur(1px)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 99999999,
            }}
        >
            <div onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: "white",
                    width: "800px",
                    padding: "40px 40px 20px 40px",
                    borderRadius: "8px",
                }}>

                <div style={{ display: "flex", justifyContent: "end" }}>
                    <button
                        onClick={(e) => {  // FIXED: Stop on X
                            e.stopPropagation();
                            closeModal();
                        }}
                        style={{
                            border: "2px solid #727681",
                            borderRadius: "50px",
                            width: "25px",
                            height: "25px",
                            backgroundColor: "white",
                            color: "#727681",
                            fontWeight: "500",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: "13px",
                        }}
                    >
                        x
                    </button>
                </div>

                {errorMessage && <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                    }}
                >
                    <div
                        className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
                        style={{
                            border: "1px solid #DC3545",
                            color: "#DC3545",
                            background: "#FFF1F3",
                            borderRadius: "8px",
                            padding: "10px",
                            pointerEvents: "auto",
                        }}>
                        <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                            {errorMessage}
                        </label>
                    </div>
                </div>}


                {successMessage && <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                    }}
                >
                    <div
                        className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
                        style={{
                            border: "1px solid #0D6828",
                            color: "#0D6828",
                            background: "#EBFFF1",
                            borderRadius: "8px",
                            padding: "10px",
                        }}>
                        <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                            {successMessage}
                        </label>
                    </div>
                </div>}

                <div style={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 16, display: 'inline-flex' }}>

                    <div style={{ alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
                        <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 22, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word' }}>Return Product</div>
                    </div>

                    <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'flex' }}>
                        {/* input invoice */}
                        <div data-property-1="Before" style={{ width: 359, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 4, display: 'inline-flex' }}>
                            <div style={{ alignSelf: 'stretch' }}><span style={{ color: '#727681', fontSize: 12, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>Enter Invoice No. </span><span style={{ color: 'var(--Danger, #D00003)', fontSize: 12, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>*</span></div>
                            <div style={{ alignSelf: 'stretch', height: 40, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: 'white', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'inline-flex' }}>
                                <input type="search"
                                    placeholder="Enter Invoice No."
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            fetchSaleByInvoice();
                                        }
                                    }}
                                    style={{ color: '#727681', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word', width: '100%', outline: 'none', border: 'none' }}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fetchSaleByInvoice();
                                    }}
                                    disabled={loading}
                                    style={{ height: "24px", width: "auto", border: "none", borderRadius: "5px", background: "#1E90FF", color: "#fff", fontSize: "10px", fontWeight: 500, padding: "0 6px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, }}
                                >Search</button>
                            </div>
                        </div>

                        {/* table */}
                        {Array.isArray(sale?.items) && sale.items.length > 0 &&
                            <>
                                <div style={{ width: '100%' }}>
                                    <div style={{ padding: '4px 4px' }}><span style={{ color: 'black' }}>Date:</span> {new Date(sale?.createdAt).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric"
                                    })}
                                    </div>

                                    <table style={{ width: "100%", borderCollapse: "collapse", }}>
                                        <thead style={{ backgroundColor: "#F6F9FA" }}>
                                            <tr style={{ color: "#0E101A", fontSize: 12, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word', }}>
                                                <th style={{ padding: "8px", borderTopLeftRadius: "8px" }}>Sold Items</th>
                                                <th>QTY</th>
                                                <th>Total Amount</th>
                                                <th style={{ borderTopRightRadius: "8px", textAlign: 'right', padding: '8px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Array.isArray(sale?.items) && sale.items.length > 0 ? (
                                                sale.items.map((item) => {
                                                    const currentStatus = String(item?.status || "Sold");
                                                    const isReturned = currentStatus === "Return";
                                                    const isSelected = selectedItemIds.some((x) => String(x) === String(item?._id));
                                                    const refundable = refundableAmountForItem(item);
                                                    return (
                                                        <tr key={String(item?._id)} style={{ borderBottom: "1px solid #EAEAEA", borderLeft: "1px solid #EAEAEA", borderRight: "1px solid #EAEAEA" }}>
                                                            <td style={{ padding: "10px 8px", fontSize: 13, color: "#0E101A" }}>{item?.productName || "-"}</td>
                                                            <td style={{ padding: "10px 8px", fontSize: 13, color: "#0E101A" }}>{Number(item?.quantity || 0)}</td>
                                                            <td style={{ padding: "10px 8px", fontSize: 13, color: "#0E101A" }}>₹{refundable.toFixed(2)}</td>
                                                            <td style={{ padding: "10px 8px", textAlign: 'right' }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleReturnSelection(item);
                                                                    }}
                                                                    disabled={isReturned || loading}
                                                                    style={{
                                                                        border: isReturned ? "1px solid #bdbec0ff" : "1px solid #1F7FFF",
                                                                        borderRadius: 6,
                                                                        padding: "6px 10px",
                                                                        background: isReturned ? "#fdfafaff" : (isSelected ? "#1F7FFF" : "white"),
                                                                        color: isReturned ? "#727681" : (isSelected ? "white" : "#1F7FFF"),
                                                                        cursor: isReturned || loading ? "not-allowed" : "pointer",
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                    }}
                                                                >
                                                                    {isReturned ? "Returned" : (isSelected ? "Selected" : "Return")}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} style={{ padding: "14px 8px", color: "#727681", fontSize: 12 }}>
                                                        {loading ? "Loading..." : "Enter invoice number to see items..."}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        }

                        {/* payment settlement */}
                        <div style={{ width: "100%", background: 'white', overflow: 'hidden', borderRadius: 16, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex' }}>
                            <div style={{ alignSelf: 'stretch', paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16, background: 'var(--Form-Filling-BG, #F6F9FA)', borderBottom: '1px var(--White-Stroke, #EAEAEA) solid', justifyContent: 'space-between', alignItems: 'flex-start', display: 'inline-flex' }}>
                                <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 12, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word' }}>Payment Settlement</div>
                            </div>

                            <div style={{ alignSelf: 'stretch', padding: 24, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'flex' }}>
                                <div style={{ alignSelf: 'stretch', paddingLeft: 24, paddingRight: 24, paddingTop: 12, paddingBottom: 12, borderRadius: 12, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex' }}>
                                    <div style={{ color: 'var(--Blue-Blue, #1F7FFF)', fontSize: 32, fontFamily: 'Inter', fontWeight: '600', wordWrap: 'break-word' }}>₹{totalRefundAmount.toFixed(2)}</div>
                                    <div style={{ color: 'var(--Blue-Blue, #1F7FFF)', fontSize: 12, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>Total Payable Amount</div>
                                </div>

                                <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'flex' }}>
                                    <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>Select Payment Mode</div>
                                    <div style={{ alignSelf: 'stretch', height: 71, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'flex' }}>
                                        <div style={{ alignSelf: 'stretch', flex: '1 1 0', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'inline-flex' }}>
                                            <div
                                                onClick={() => setPaymentMethod("Cash")}
                                                style={{ flex: '1 1 0', alignSelf: 'stretch', padding: 12, background: `${paymentMethod === "Cash" ? "#1f80ff10" : 'white'}`, borderRadius: 12, outline: `1px ${paymentMethod === "Cash" ? "#1F7FFF" : "var(--Black-Disable, #A2A8B8)"} solid`, justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                                                <img src={cash_icon} alt="cash_icon" style={{ width: 40, }} />
                                                <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>Cash</div>
                                            </div>

                                            <div
                                                onClick={() => setPaymentMethod("UPI")}
                                                style={{ flex: '1 1 0', alignSelf: 'stretch', padding: 12, background: `${paymentMethod === "UPI" ? "#1f80ff10" : 'white'}`, borderRadius: 12, outline: `1px ${paymentMethod === "UPI" ? "#1F7FFF" : "var(--Black-Disable, #A2A8B8)"} solid`, justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                                                <img src={upi_icon} alt="upi_icon" style={{ width: 40, }} />
                                                <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>UPI</div>
                                            </div>

                                            <div
                                                // onClick={() => setPaymentMethod("Card")}
                                                style={{ flex: '1 1 0', alignSelf: 'stretch', padding: 12, background: `${paymentMethod === "Card" ? "#1f80ff10" : 'white'}`, borderRadius: 12, outline: `1px ${paymentMethod === "Card" ? "#1F7FFF" : "var(--Black-Disable, #A2A8B8)"} solid`, justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'not-allowed' }}>
                                                <img src={card_icon} alt="card_icon" style={{ width: 40, }} />
                                                <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>Card</div>
                                            </div>

                                            <div
                                                // onClick={() => setPaymentMethod("Split")}
                                                style={{ flex: '1 1 0', alignSelf: 'stretch', padding: 12, background: `${paymentMethod === "Split" ? "#1f80ff10" : 'white'}`, borderRadius: 12, outline: `1px ${paymentMethod === "Split" ? "#1F7FFF" : "var(--Black-Disable, #A2A8B8)"} solid`, justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'not-allowed' }}>
                                                <img src={split_icon} alt="split_icon" style={{ width: 40, }} />
                                                <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>Split</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ alignSelf: 'stretch', height: 70, justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'inline-flex', borderTop: '1px var(--Black-Disable, #A2A8B8) dashed', padding: '12px 0' }}>
                                    <div onClick={closeModal}
                                        style={{ width: 125, alignSelf: 'stretch', paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--Black-Disable, #A2A8B8) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 4, display: 'flex', cursor: 'pointer' }}>
                                        <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Grey, #727681)', fontSize: 14, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word' }}>Cancel</div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            completeReturnTransaction();
                                        }}
                                        style={{ flex: '1 1 0', alignSelf: 'stretch', paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: 'var(--Blue-Blue, #1F7FFF)', borderRadius: 8, outline: '1px var(--Blue-Blue, #1F7FFF) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 4, display: 'flex', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                                        <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--White-White-1, white)', fontSize: 14, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word' }}>Complete Transaction</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PosReturn;
