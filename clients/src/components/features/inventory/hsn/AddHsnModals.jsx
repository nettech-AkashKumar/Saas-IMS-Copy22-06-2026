import React, { useState, useRef, useEffect } from "react";

const AddHsnModals = ({ show, onClose, modalData, setModalData, onSubmit, errors = {} }) => {
    if (!show) return null;
    const hsnCodeRef = useRef(null); useEffect(() => {
        if (hsnCodeRef.current) {
            hsnCodeRef.current.focus();
        }
    }, []);

    if (!show) return null;

    return (
        <div className="modal d-block" tabIndex="-1" role="dialog"
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
            }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">

                    {/* header */}
                    <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h5 className="modal-title">{modalData.id ? 'Edit HSN' : 'Add HSN'}</h5>
                        {/* <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button> */}
                    </div>

                    {/* inputs */}
                    <div className="modal-body">

                        {/* hsn code */}
                        <div className="my-2">
                            <label className="form-label">
                                HSN Code
                                <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Enter HSN Code"
                                maxLength={8}
                                value={modalData.hsnCode}
                                ref={hsnCodeRef}
                                onChange={e => setModalData({ ...modalData, hsnCode: e.target.value })}
                            />
                            {errors.hsnCode && (<p className='text-danger'>{errors.hsnCode}</p>)}
                        </div>

                        {/* description */}
                        <div className="my-2">
                            <label className="form-label">
                                Description
                                <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                                className="form-control"
                                placeholder="Enter Description"
                                value={modalData.description}
                                onChange={e => setModalData({ ...modalData, description: e.target.value })}
                            />
                            {errors.description && (<p className='text-danger'>{errors.description}</p>)}
                        </div>

                        {/* gst rate */}
                        <div className="my-2">
                            <label className="form-label">
                                GST Rate
                                <span className="text-danger ms-1">*</span>
                            </label>
                            <input
                                className="form-control"
                                placeholder="Enter GST Rate"
                                type="number"
                                value={modalData.gstRate}
                                onChange={e => setModalData({ ...modalData, gstRate: e.target.value })}
                            />
                            {errors.gstRate && (<p className='text-danger'>{errors.gstRate}</p>)}
                        </div>
                    </div>

                    {/* button */}
                    <div className="modal-footer" style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={onSubmit}>Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddHsnModals;
