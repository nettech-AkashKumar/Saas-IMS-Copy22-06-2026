import React, { useState } from "react";

const Pagination = () => {
  const [page, setPage] = useState(1);
  const totalPages = 1;
  const rowsPerPage = 10;

  const styles = {
    container: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      paddingTop: "5px",
      fontFamily: "Inter",
      color: "#6c6e75",
      fontSize: "14px",
  
    },
    leftText: {
      fontSize: "14px",
      color:"#727681",
       fontFamily: "Inter",
    },
    midText: {
      fontSize: "14px",
      color:"black",
       fontFamily: "Inter",
    },
    paginationWrapper: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    navBtn: {
    //   border: "1px solid #d1d3da",
      padding: "4px 6px",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "24px",
      color: "#727681",
       fontFamily:"inter",
    },
    disabledBtn: {
    //   opacity: 0.3,
      cursor: "not-allowed",
    },
    pageBox: {
      border: "1px solid #d1d3da",
      padding: "4px 10px",
      borderRadius: "5px",
      minWidth: "35px",
      textAlign: "center",
      backgroundColor: "white",
      color:'black',
    },
    rightSection: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    dropdown: {
      border: "1px solid #d1d3da",
      borderRadius: "5px",
      padding: "5px 8px",
      outline: "none",
      cursor: "pointer",
      backgroundColor: "white",
    },
  };

  return (
    <div className="" style={styles.container}>
      
      {/* Left text */}
      <div style={styles.leftText}>
        Showing <b>1</b> of <b>6</b> from <b>6</b>
      </div>

      {/* Pagination buttons */}
      <div style={styles.paginationWrapper}>
        <span style={{ ...styles.navBtn, ...styles.disabledBtn }}>«</span>
        <span style={{ ...styles.navBtn, ...styles.disabledBtn }}>‹</span>

        <div style={styles.pageBox}>{page}</div>

        <span style={styles.midText}> <span style={{color:'#727681'}}>of</span> {totalPages}</span>

        <span style={{ ...styles.navBtn, ...styles.disabledBtn }}>›</span>
        <span style={{ ...styles.navBtn, ...styles.disabledBtn }}>»</span>
      </div>

      {/* Right side rows per page */}
      <div style={styles.rightSection}>
        <span>Rows per page:</span>
        <select style={styles.dropdown} defaultValue={rowsPerPage}>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
        </select>
      </div>
    </div>
  );
};

export default Pagination;
