import React from "react";

const ViewDamageModal = ({ closeModal, selectedProduct }) => {

    const handleInnerClick = (e) => {
        e.stopPropagation();
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
            <div
                onClick={handleInnerClick}
                // ref={modelViewRef}
                className="create-category-modelbox"
                style={{
                    backgroundColor: "white",
                    width: "800px",
                    padding: "50px 40px",
                    borderRadius: "8px",
                }}
            >
                <div style={{ display: "flex", justifyContent: "end" }}>
                    <button
                        onClick={closeModal}
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
                        X
                    </button>
                </div>


                <h1 style={{ color: "#0E101A", fontSize: "22px", fontFamily: "Inter" }}>
                    View Damage
                </h1>
                <form action="">
                    <div className="add-category-form d-flex gap-3 pt-3 pb-3">
                        <div className="d-flex flex-column gap-1 w-100">
                            <label
                                htmlFor=""
                                style={{
                                    color: "black",
                                    fontFamily: "Inter",
                                    fontSize: "13px",
                                }}
                            >
                                Category
                            </label>
                            <div
                                className="border-hover"
                                type="name"
                                placeholder="Enter Name"
                                style={{
                                    border: "1px solid #dfddddff",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    outline: "none",
                                }}
                            >{selectedProduct?.category?.categoryName || ''}
                            </div>
                        </div>
                        <div className="d-flex flex-column gap-1 w-100">
                            <label
                                htmlFor=""
                                style={{
                                    color: "black",
                                    fontFamily: "Inter",
                                    fontSize: "13px",
                                }}
                            >
                                Product Name
                            </label>
                            <div
                                className="border-hover"
                                type="name"
                                placeholder="Enter Name"
                                style={{
                                    border: "1px solid #dfddddff",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    outline: "none",
                                }}
                            >{selectedProduct?.product?.productName || ''}
                            </div>
                        </div>
                    </div>

                    <div className="add-category-form d-flex gap-3 pt-3 pb-3">
                        <div className="d-flex flex-column gap-1 w-100">
                            <label
                                htmlFor=""
                                style={{
                                    color: "black",
                                    fontFamily: "Inter",
                                    fontSize: "13px",
                                }}
                            >
                                Damage Quantity
                            </label>
                            <div
                                className="border-hover"
                                type="name"
                                placeholder="Enter Name"
                                style={{
                                    border: "1px solid #dfddddff",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    outline: "none",
                                }}
                            >{selectedProduct?.quantity || ''}
                            </div>
                        </div>
                    </div>

                    <div className="d-flex flex-column gap-1 w-100 pb-4">
                        <label
                            htmlFor=""
                            style={{
                                color: "black",
                                fontFamily: "Inter",
                                fontSize: "13px",
                            }}
                        >
                            Review
                        </label>
                        <div
                            className="border-hover"
                            type="name"
                            placeholder="Enter Name"
                            style={{
                                border: "1px solid #dfddddff",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                outline: "none",
                            }}
                        >{selectedProduct?.remarks || ''}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ViewDamageModal
