import React from "react";

const Pagination = ({
  currentPage,
  total,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100, 'All'],
}) => {
  const totalNumber = Number(total) || 0;
  const itemsPerPageNumber = Math.max(1, Number(itemsPerPage) || 1);
  const totalPages = Math.max(1, Math.ceil(totalNumber / itemsPerPageNumber) || 1);
  const start = totalNumber ? (Number(currentPage) - 1) * itemsPerPageNumber + 1 : 0;
  const end = totalNumber ? Math.min(totalNumber, Number(currentPage) * itemsPerPageNumber) : 0;

  const showAllSelected =
    itemsPerPageOptions.includes("All") &&
    totalNumber > 0 &&
    itemsPerPageNumber >= totalNumber;
  const dropdownValue = showAllSelected ? "All" : String(itemsPerPageNumber);

  const styles = {
    container: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      padding: "0px 0px",
      fontFamily: "Inter",
      color: "#6c6e75",
      fontSize: "14px",

    },
    leftText: {
      fontSize: "14px",
      color: "#727681",
      fontFamily: "Inter",
    },
    midText: {
      fontSize: "14px",
      color: "black",
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
      fontFamily: "inter",
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
      color: 'black',
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
    <div className="flex-wrap paginations-ims-alignment" style={styles.container}>

      {/* Left text */}
      <div className="" style={styles.leftText}>
        Showing <b>{start}</b> to <b>{end}</b> of <b>{Number(total) || 0}</b>
      </div>

      {/* Pagination buttons */}
      <div className="paginations-buttons-ims" style={styles.paginationWrapper}>
        <span
          style={{
            ...styles.navBtn,
            ...(currentPage === 1 ? styles.disabledBtn : {}),
          }}
          onClick={() => currentPage !== 1 && onPageChange(1)}
        >
          «
        </span>
        <span
          style={{
            ...styles.navBtn,
            ...(currentPage === 1 ? styles.disabledBtn : {}),
          }}
          onClick={() => currentPage !== 1 && onPageChange(Math.max(1, Number(currentPage) - 1))}
        >
          ‹
        </span>

        <div style={styles.pageBox}>{currentPage}</div>

        <span style={styles.midText}> <span style={{ color: '#727681' }}>of</span> {totalPages}</span>

        <span
          style={{
            ...styles.navBtn,
            ...(currentPage >= totalPages ? styles.disabledBtn : {}),
          }}
          onClick={() => currentPage < totalPages && onPageChange(Math.min(totalPages, Number(currentPage) + 1))}
        >
          ›
        </span>
        <span
          style={{
            ...styles.navBtn,
            ...(currentPage >= totalPages ? styles.disabledBtn : {}),
          }}
          onClick={() => currentPage < totalPages && onPageChange(totalPages)}
        >
          »
        </span>
      </div>

      {/* Right side rows per page */}
      <div className="paginations-buttons-ims-rows-per-page" style={styles.rightSection}>
        <span>Rows per page:</span>
        <select
          style={styles.dropdown}
          value={dropdownValue}
          // onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "All") {
              if (totalNumber > 0) onItemsPerPageChange(totalNumber);
            } else {
              onItemsPerPageChange(Number(value));
            }
          }}
        >
          {itemsPerPageOptions.map((n) => (
            <option key={String(n)} value={String(n)}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;
