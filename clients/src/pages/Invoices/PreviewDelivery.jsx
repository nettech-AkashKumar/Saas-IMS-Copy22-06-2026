import React, { useEffect, useState, useRef } from 'react';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { toast } from "react-toastify";
import api from "../config/axiosInstance";
import { DeliveryChallanContent } from "./DeliveryChallanContent";

const PreviewDeliveryChallan = ({ isOpen, onClose, challanId, challanData: initialChallanData, customerData: initialCustomerData, companyData: initialCompanyData }) => {
    const [challan, setChallan] = useState(initialChallanData || null);
    const [customer, setCustomer] = useState(initialCustomerData || null);
    const [companyData, setCompanyData] = useState(initialCompanyData || null);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const modelRef = useRef(null);
    const challanRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, challanId, initialChallanData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (challanId && !initialChallanData) {
                const res = await api.get(`/api/delivery-challans/${challanId}`);
                if (res.data.success) {
                    const ch = res.data.deliveryChallan;
                    setChallan(ch);
                    if (ch.customerId) {
                        const addressParts = [];
                        if (ch.customerId.address) addressParts.push(ch.customerId.address);
                        if (ch.customerId.city) addressParts.push(ch.customerId.city);
                        if (ch.customerId.state) addressParts.push(ch.customerId.state);
                        if (ch.customerId.country) addressParts.push(ch.customerId.country);
                        if (ch.customerId.pincode) addressParts.push(ch.customerId.pincode);
                        setCustomer({
                            name: ch.customerId.name,
                            address: addressParts.length > 0 ? addressParts.join(", ") : (ch.customerId.address || "-"),
                            phone: ch.customerId.phone,
                            email: ch.customerId.email,
                            gstin: ch.customerId.gstin
                        });
                    }
                }
            } else {
                setChallan(initialChallanData);
                setCustomer(initialCustomerData);
            }

            if (!initialCompanyData) {
                const companyRes = await api.get(`/api/companyprofile/get`);
                setCompanyData(companyRes.data.data);
            }

            const banksRes = await api.get("/api/company-bank/list");
            setBanks(banksRes.data.data);

        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch preview data");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: "0px",
                left: "0px",
                zIndex: 999999,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                backgroundColor: "rgba(0, 0, 0, 0.27)",
                backdropFilter: "blur(0.1px)",
                overflow: "auto",
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: "#F3F5F6",
                    padding: 6,
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    width: "40%",
                    marginTop: '15px',
                    height: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    position: "absolute",
                }}
                ref={modelRef}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        paddingLeft: 36.37,
                        paddingRight: 36.37,
                        padding: "16px 36px 36px 36px",
                    }}
                >
                    <div
                        style={{
                            borderBottom: "1px solid #EAEAEA",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                marginBottom: "10px",
                                color: 'black',
                            }}
                        >
                            Preview Delivery Challan
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div
                                style={{
                                    color: "red",
                                    padding: "9px",
                                    background: "white",
                                    border: "1px solid #EAEAEA",
                                    borderRadius: "50%",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                }}
                                onClick={onClose}
                            >
                                <IoIosCloseCircleOutline size={24} />
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            paddingTop: 20,
                            position: "relative",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            gap: 18.18,
                            display: "inline-flex",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                            }}
                        >
                            {loading ? (
                                <div style={{ padding: '50px', textAlign: 'center', background: 'white', width: '100%' }}>Loading...</div>
                            ) : (
                                <DeliveryChallanContent
                                    ref={challanRef}
                                    challan={challan}
                                    customer={customer}
                                    companyData={companyData}
                                    banks={banks}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewDeliveryChallan;