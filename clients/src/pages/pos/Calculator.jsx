import { useState, useCallback } from "react";

const styles = {
  wrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    // background: "#f5f5f0",
    fontFamily: "'Courier New', Courier, monospace",
  },
  calc: {
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e0e0d8",
    width: "280px",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  display: {
    padding: "1.25rem 1rem 0.75rem",
    textAlign: "right",
    minHeight: "88px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    background: "#fafaf7",
    borderBottom: "1px solid #e0e0d8",
  },
  expr: {
    fontSize: "12px",
    color: "#aaa",
    minHeight: "18px",
    marginBottom: "4px",
    letterSpacing: "0.04em",
  },
  number: {
    fontSize: "32px",
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: "-0.02em",
    wordBreak: "break-all",
    lineHeight: 1.1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1px",
    background: "#e0e0d8",
  },
  btn: {
    background: "#ffffff",
    border: "none",
    height: "62px",
    fontSize: "16px",
    fontWeight: "400",
    color: "#1a1a1a",
    cursor: "pointer",
    fontFamily: "'Courier New', Courier, monospace",
    transition: "background 0.08s",
  },
  btnOp: {
    background: "#ffffff",
    border: "none",
    height: "62px",
    fontSize: "20px",
    fontWeight: "400",
    color: "#2563eb",
    cursor: "pointer",
    fontFamily: "'Courier New', Courier, monospace",
    transition: "background 0.08s",
  },
  btnFn: {
    background: "#f5f5f0",
    border: "none",
    height: "62px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#555",
    cursor: "pointer",
    fontFamily: "'Courier New', Courier, monospace",
    transition: "background 0.08s",
  },
  btnEq: {
    background: "#2563eb",
    border: "none",
    height: "62px",
    fontSize: "22px",
    fontWeight: "400",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "'Courier New', Courier, monospace",
    transition: "background 0.08s",
  },
  btnZero: {
    gridColumn: "span 2",
  },
};

function compute(a, b, op) {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? null : a / b;
    default: return b;
  }
}

function formatNum(val) {
  if (val === "Error") return "Error";
  const n = parseFloat(val);
  if (isNaN(n)) return "0";
  const str = n.toPrecision(10).replace(/\.?0+$/, "");
  return str.length > 12 ? n.toExponential(4) : str;
}

const Calculator = ({ closeModal }) => {
  // current  = the number being typed right now
  // prev     = the number before the operator
  // op       = pending operator
  // expr     = top display line
  // waitNext = true right after an operator is pressed; next digit starts fresh
  const [state, setState] = useState({
    current: "0",
    prev: null,
    op: null,
    expr: "",
    waitNext: false,
    justEvaled: false,
  });

  const handleDigit = useCallback((digit) => {
    setState((s) => {
      // After pressing = or after pressing an operator, start fresh
      if (s.waitNext || s.justEvaled) {
        return { ...s, current: digit, waitNext: false, justEvaled: false };
      }
      const next =
        s.current === "0" ? digit : s.current.length < 12 ? s.current + digit : s.current;
      return { ...s, current: next };
    });
  }, []);

  const handleDot = useCallback(() => {
    setState((s) => {
      if (s.waitNext || s.justEvaled) {
        return { ...s, current: "0.", waitNext: false, justEvaled: false };
      }
      if (s.current.includes(".")) return s;
      return { ...s, current: s.current + "." };
    });
  }, []);

  const handleOp = useCallback((op) => {
    setState((s) => {
      let next = parseFloat(s.current);
      // Chain: if there's already a pending op and user typed a number after it
      if (s.op && s.prev !== null && !s.waitNext) {
        const result = compute(parseFloat(s.prev), next, s.op);
        const resultStr = result === null ? "Error" : String(result);
        return {
          ...s,
          prev: resultStr,
          current: resultStr,
          op,
          expr: formatNum(resultStr) + " " + op,
          waitNext: true,
          justEvaled: false,
        };
      }
      return {
        ...s,
        prev: s.current,
        op,
        expr: formatNum(s.current) + " " + op,
        waitNext: true,  // <-- key fix: next digit press starts a fresh number
        justEvaled: false,
      };
    });
  }, []);

  const handleEquals = useCallback(() => {
    setState((s) => {
      if (!s.op || s.prev === null) return s;
      const a = parseFloat(s.prev);
      const b = parseFloat(s.current);
      const result = compute(a, b, s.op);
      const resultStr = result === null ? "Error" : String(result);
      return {
        ...s,
        current: resultStr,
        prev: null,
        op: null,
        expr: formatNum(s.prev) + " " + s.op + " " + formatNum(s.current) + " =",
        waitNext: false,
        justEvaled: true,
      };
    });
  }, []);

  const handleClear = useCallback(() => {
    setState({ current: "0", prev: null, op: null, expr: "", waitNext: false, justEvaled: false });
  }, []);

  const handleSign = useCallback(() => {
    setState((s) => {
      const toggled = s.current.startsWith("-") ? s.current.slice(1) : "-" + s.current;
      return { ...s, current: toggled === "-0" ? "0" : toggled };
    });
  }, []);

  const handlePercent = useCallback(() => {
    setState((s) => ({
      ...s,
      current: String(parseFloat(s.current) / 100),
    }));
  }, []);

  const hover = (e) => (e.currentTarget.style.background = "#f0f0eb");
  const unhover = (e, base = "#ffffff") => (e.currentTarget.style.background = base);

  return (
    <div
      onClick={closeModal}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "70vw",
        height: "100vh",
        // backgroundColor: "rgba(0,0,0,0.27)",
        // backdropFilter: "blur(1px)",
        display: "flex",
        justifyContent: "center",
        // alignItems: "center",
        zIndex: 999,
      }}
    >
      <div style={styles.wrap} onClick={(e) => e.stopPropagation()}>
        <div style={styles.calc}>
          <div style={styles.display}>
            <div style={styles.expr}>{state.expr || "\u00A0"}</div>
            <div style={styles.number}>{formatNum(state.current)}</div>
          </div>

          <div style={styles.grid}>
            {/* Row 1 */}
            <button style={styles.btnFn} onClick={handleClear} onMouseEnter={hover} onMouseLeave={(e) => unhover(e, "#f5f5f0")}>AC</button>
            <button style={styles.btnFn} onClick={handleSign} onMouseEnter={hover} onMouseLeave={(e) => unhover(e, "#f5f5f0")}>+/−</button>
            <button style={styles.btnFn} onClick={handlePercent} onMouseEnter={hover} onMouseLeave={(e) => unhover(e, "#f5f5f0")}>%</button>
            <button style={styles.btnOp} onClick={() => handleOp("÷")} onMouseEnter={hover} onMouseLeave={(e) => unhover(e)}>÷</button>

            {/* Row 2 */}
            {["7", "8", "9"].map((d) => (
              <button key={d} style={styles.btn} onClick={() => handleDigit(d)} onMouseEnter={hover} onMouseLeave={(e) => unhover(e)}>{d}</button>
            ))}
            <button style={styles.btnOp} onClick={() => handleOp("×")} onMouseEnter={hover} onMouseLeave={(e) => unhover(e)}>×</button>

            {/* Row 3 */}
            {["4", "5", "6"].map((d) => (
              <button key={d} style={styles.btn} onClick={() => handleDigit(d)} onMouseEnter={hover} onMouseLeave={(e) => unhover(e)}>{d}</button>
            ))}
            <button style={styles.btnOp} onClick={() => handleOp("−")} onMouseEnter={hover} onMouseLeave={(e) => unhover(e)}>−</button>

            {/* Row 4 */}
            {["1", "2", "3"].map((d) => (
              <button key={d} style={styles.btn} onClick={() => handleDigit(d)} onMouseEnter={hover} onMouseLeave={(e) => unhover(e)}>{d}</button>
            ))}
            <button style={styles.btnOp} onClick={() => handleOp("+")} onMouseEnter={hover} onMouseLeave={(e) => unhover(e)}>+</button>

            {/* Row 5 */}
            <button style={{ ...styles.btn, ...styles.btnZero }} onClick={() => handleDigit("0")} onMouseEnter={hover} onMouseLeave={(e) => unhover(e)}>0</button>
            <button style={styles.btn} onClick={handleDot} onMouseEnter={hover} onMouseLeave={(e) => unhover(e)}>.</button>
            <button style={styles.btnEq} onClick={handleEquals} onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")} onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}>=</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calculator;
