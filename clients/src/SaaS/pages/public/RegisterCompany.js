import { useState } from "react";

const BASE_URL = "http://localhost:4000";

export default function RegisterCompany() {
  const [form, setForm] = useState({
    companyName: "",
    subdomain: "",
    plan: "BASIC",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const submit = async () => {
    for (let key in form) {
      if (!form[key]) return alert("❌ All fields are required");
    }

    try {
      const res = await fetch(`${BASE_URL}/api/public/register-company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) return alert(`❌ ${data.message}`);

      alert("✅ Company Registered Successfully");
      setForm({
        companyName: "",
        subdomain: "",
        plan: "BASIC",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
      });
    } catch (error) {
      alert("❌ Something went wrong");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>🚀 Register Your Company</h2>
        <p style={styles.subtitle}>Create your SaaS workspace</p>

        <input
          placeholder="Company Name"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          style={styles.input}
        />

        <input
          placeholder="Subdomain (e.g. acme)"
          value={form.subdomain}
          onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
          style={styles.input}
        />

        <input
          placeholder="Admin Name"
          value={form.adminName}
          onChange={(e) => setForm({ ...form, adminName: e.target.value })}
          style={styles.input}
        />

        <input
          type="email"
          placeholder="Admin Email"
          value={form.adminEmail}
          onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Admin Password"
          value={form.adminPassword}
          onChange={(e) =>
            setForm({ ...form, adminPassword: e.target.value })
          }
          style={styles.input}
        />

        <select
          value={form.plan}
          onChange={(e) => setForm({ ...form, plan: e.target.value })}
          style={styles.input}
        >
          <option value="BASIC">Basic Plan</option>
          <option value="PRO">Pro Plan</option>
        </select>

        <button onClick={submit} style={styles.button}>
          Register Company
        </button>
      </div>
    </div>
  );
}

/* 🎨 UI Styles */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #4facfe, #00f2fe)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "360px",
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "14px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
  },
  title: {
    textAlign: "center",
    marginBottom: "5px",
    color: "#333",
  },
  subtitle: {
    textAlign: "center",
    fontSize: "14px",
    color: "#777",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#fff",
    background: "linear-gradient(135deg, #4facfe, #00c6fb)",
  },
};
