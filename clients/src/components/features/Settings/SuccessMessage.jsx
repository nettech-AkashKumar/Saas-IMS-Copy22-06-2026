import React from 'react';
import { BsPatchCheck } from "react-icons/bs";

const SuccessMessage = () => {
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    color: '#155724',
    padding: '12px 16px',
    borderRadius: '4px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    margin: '10px 0',
    width: "100%"
  };

  const iconStyle = {
    marginRight: '10px',
    fontSize: '18px',
  };

  const previewLinkStyle = {
    color: '#155724',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={iconStyle}><BsPatchCheck /></span>
        <span>User Successfully Created</span>
      </div>
    </div>
  );
};

export default SuccessMessage;
