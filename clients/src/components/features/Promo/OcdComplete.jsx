import React, { useState } from 'react'

import { GrSend } from "react-icons/gr";
import { FaRegCopy } from "react-icons/fa6";
import { RiMessage2Fill } from "react-icons/ri";
import { RiWhatsappFill } from "react-icons/ri";

import Surprisebox from '../../assets/images/Surprisebox.gif';
import { Link } from 'react-router-dom';

function OcdComplete() {
    const[shareoptions, setShareoptions] = useState(false);

    const handleShareOptions = () => {
        setShareoptions(!shareoptions);
    }

    return (
        <div
            className='px-4 py-2'
            style={{
                minHeight: '100vh',
                width: '100%',
                background: '#F8FAFC',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                overflow: 'auto',
            }}
        >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '100vh', overflow: 'auto', alignItems: 'center' }}>
                <div
                    style={{
                        width: "532px",
                        height: "auto",
                        boxShadow: "0px 0px 23px rgba(0,110,255,0.25)",
                        overflow: "hidden",
                        borderRadius: 16,
                        outline: "1px solid #EAEAEA",
                        background: "#fff",
                        zIndex: 2,
                        position: 'relative',
                        paddingBottom: '30px',
                    }}
                >
                    {/* Close Button */}
                    <Link
                        to="/m/pointsrewards"
                     style={{
                        display: 'flex',
                        justifyContent: 'end',
                        padding: '15px',
                        textDecoration: 'none',
                    }}>
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                right: "16px",
                                top: "16px",
                                border: "2px solid #D00003",
                                borderRadius: "50%",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontWeight: "600",
                                color: "#D00003",
                                fontSize: "18px",
                            }}
                        >
                            X
                        </div>
                    </Link>

                    {/* Image */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                    }}>
                        <img
                            src={Surprisebox}
                            style={{
                                width: "450px",
                                borderRadius: "12px",
                                objectFit: "cover",
                            }}
                        />
                    </div>

                    {/* Gradient Circle */}
                    <div
                        style={{
                            height: "auto",
                            width: '532px',
                            borderTopLeftRadius: "50%",
                            borderTopRightRadius: "50%",
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '30px',
                            overflow: 'hidden',
                        }}
                    >

                        <div style={{
                            borderRadius: '50%',
                            background: "linear-gradient(318deg, #091A45 0%, #436AEB 100%)",
                            position: 'absolute',
                            width: '1750px',
                            height: '1600px',
                            zIndex: 1,
                        }}>
                        </div>

                        <div style={{
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '40px',
                        }}>
                            {/* Heading */}
                            <div>
                                <div
                                    style={{
                                        width: "100%",
                                        marginTop: "60px",
                                        textAlign: "center",
                                        fontSize: "32px",
                                        fontWeight: 700,
                                        color: "#fff",
                                        fontFamily: "Inter",
                                    }}
                                >
                                    Congratulations !!!
                                </div>

                                {/* Subtext */}
                                <div
                                    style={{
                                        width: "100%",
                                        textAlign: "center",
                                        fontSize: "16px",
                                        fontWeight: 400,
                                        color: "#F5F5F5",
                                        fontFamily: "Inter",
                                    }}
                                >
                                    You have successfully created your Reward System.
                                </div>
                            </div>

                            {/* Link Box + Share Button */}
                            <div
                                style={{
                                    width: "100%",
                                    top: "515px",
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: "25px",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{display:'flex', gap:'14px'}}>
                                    {/* Link Box */}
                                <div
                                    style={{
                                        width: "320px",
                                        height: "48px",
                                        padding: "12px 16px",
                                        background: "#fff",
                                        borderRadius: "8px",
                                        outline: "1.5px solid #1F7FFF",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        cursor: "pointer",
                                        justifyContent: "space-between",
                                        boxShadow: "inset -1px -1px 4px rgba(0,0,0,0.25)",
                                    }}
                                >
                                    <div
                                        style={{
                                            color: "#1F7FFF",
                                            fontSize: "16px",
                                            fontWeight: 500,
                                            fontFamily: "Inter",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        https://kasperinfotech.dummylinkforrewards
                                    </div>

                                    <div
                                        style={{
                                            width: "20px",
                                            height: "20px",
                                            background: "white",
                                            borderRadius: "4px",
                                        }}
                                    >
                                        <FaRegCopy style={{ color: '#1F7FFF' }} />
                                    </div>
                                </div>

                                {/* Share Button */}
                                <div
                                    style={{
                                        height: "48px",
                                        padding: "12px 16px",
                                        background: "#fff",
                                        borderRadius: "8px",
                                        outline: "1.5px solid #1F7FFF",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        cursor: "pointer",
                                        boxShadow: "inset -1px -1px 4px rgba(0,0,0,0.25)",
                                    }}
                                    onClick={handleShareOptions}
                                >
                                    <div
                                        style={{
                                            color: "#1F7FFF",
                                            fontSize: "16px",
                                            fontWeight: 500,
                                            fontFamily: "Inter",
                                        }}
                                    >
                                        Share
                                    </div>

                                    <div
                                        style={{
                                            width: "20px",
                                            height: "20px",
                                            background: "white",
                                            borderRadius: "4px",
                                        }}
                                    >
                                        <GrSend style={{ color: '#1F7FFF' }} />
                                    </div>
                                </div>
                                </div>

                                {shareoptions && (
                                <div
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "14px",
                                    }}
                                >
                                    {/* WhatsApp */}
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            background: "#ffffff",
                                            boxShadow: "inset -1px -1px 4px rgba(0,0,0,0.25)",
                                            borderRadius: "8px",
                                            outline: "1.5px solid #1F7FFF",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "8px",
                                            cursor: "pointer",
                                            minWidth: "98px",
                                        }}
                                    >
                                        <RiWhatsappFill style={{color:'#25D366',fontSize:'40px'}} />
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 500,
                                                color: "#1F7FFF",
                                                fontFamily: "Inter",
                                            }}
                                        >
                                            WhatsApp
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div
                                        style={{
                                            padding: "12px 16px",
                                            background: "#ffffff",
                                            boxShadow: "inset -1px -1px 4px rgba(0,0,0,0.25)",
                                            borderRadius: "8px",
                                            outline: "1.5px solid #1F7FFF",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "8px",
                                            cursor: "pointer",
                                            minWidth: "102px",
                                        }}
                                    >
                                        <RiMessage2Fill style={{color:'#1F7FFF',fontSize:'40px'}} />
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 500,
                                                color: "#1F7FFF",
                                                fontFamily: "Inter",
                                            }}
                                        >
                                            Message
                                        </div>
                                    </div>
                                </div>
                                )}

                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>

    )
}

export default OcdComplete