import React, {useEffect} from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Shimmer = ({ w, h = 16, r = 6 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: r,
      background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.8s infinite",
    }}
  />
);

const Skeleton = () => {

       // Redirect logic for navigate skelton page to target page
         const navigate = useNavigate();
         const location = useLocation();
         // read redirect  path from url
         const params = new URLSearchParams(location.search);
         const redirectPath = params.get("redirect") || "/debitnote-list";
         useEffect(() => {
           const timer = setTimeout(() => {
             navigate(redirectPath);
           }, 1500); // Redirect after 1.5 seconds
       
           return () => clearTimeout(timer); // Cleanup on unmount
         }, [navigate, redirectPath]);

  return (
    <div className="dashboard" style={{ background: "#FAFAFA", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* Add shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Top white header */}
      <div style={{ height: 60, background: "white", borderBottom: "1px solid #eee" }} />

      {/* Main container */}
      <div style={{ padding: 32 }}>
        {/* Title + Preview button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 40, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shimmer w={20} h={20} r={4} />
            </div>
            <Shimmer w={320} h={36} r={8} />
          </div>
          <Shimmer w={110} h={44} r={8} />
        </div>

        {/* Big white card */}
        <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>

          {/* Supplier Details */}
          <div style={{ marginBottom: 40 }}>
            <Shimmer w={180} h={24} r={8} style={{ marginBottom: 24 }} />

            <div style={{ display: "flex", alignItems: "flex-start", gap: 40 }}>
              {/* Left */}
              <div style={{ flex: 1, display: "flex", gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <Shimmer w={110} h={16} r={4} style={{ marginBottom: 8 }} />
                  <Shimmer w="100%" h={52} r={10} />
                </div>
                <div style={{ flex: 1 }}>
                  <Shimmer w={90} h={16} r={4} style={{ marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Shimmer w={80} h={52} r={10} />
                    <Shimmer w="100%" h={52} r={10} />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 100, background: "#e0e0e0" }} />

              {/* Right */}
              <div style={{ flex: 1 }}>
                <Shimmer w={200} h={52} r={10} style={{ marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 16 }}>
                  <Shimmer w="48%" h={52} r={10} />
                  <Shimmer w="48%" h={52} r={10} />
                </div>
              </div>
            </div>
          </div>

          {/* Add Products Table */}
          <div style={{ marginBottom: 40 }}>
            <Shimmer w={160} h={24} r={8} style={{ marginBottom: 20 }} />

            {/* Header */}
            <div style={{ background: "#E5F0FF", padding: "14px 20px", borderRadius: "12px 12px 0 0", display: "flex", gap: 20 }}>
              {[70, 200, 90, 90, 110, 90, 110, 180, 130].map((width, i) => (
                <div key={i} style={{ width, textAlign: i === 0 ? "center" : "left" }}>
                  <Shimmer w={i === 1 ? 90 : 70} h={18} r={8} />
                </div>
              ))}
            </div>

            {/* Rows */}
            {[1, 2].map((row) => (
              <div
                key={row}
                style={{
                  display: "flex",
                  gap: 20,
                  padding: "16px 20px",
                  background: row === 2 ? "#FAFAFA" : "white",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div style={{ width: 70, textAlign: "center" }}><Shimmer w={24} h={24} r={6} /></div>
                <div style={{ width: 200 }}><Shimmer w="100%" h={44} r={10} /></div>
                <div style={{ width: 90 }}><Shimmer w="100%" h={44} r={10} /></div>
                <div style={{ width: 90 }}><Shimmer w="100%" h={44} r={10} /></div>
                <div style={{ width: 110 }}><Shimmer w="100%" h={44} r={10} /></div>
                <div style={{ width: 90 }}><Shimmer w="100%" h={44} r={10} /></div>
                <div style={{ width: 110 }}><Shimmer w="100%" h={44} r={10} /></div>
                <div style={{ width: 180, display: "flex", gap: 10 }}>
                  <Shimmer w="48%" h={44} r={10} />
                  <Shimmer w="48%" h={44} r={10} />
                </div>
                <div style={{ width: 130 }}><Shimmer w="100%" h={44} r={10} /></div>
              </div>
            ))}
          </div>

          {/* Bottom: Payment + Summary */}
          <div style={{ display: "flex", gap: 32 }}>
            {/* Left - Payment */}
            <div style={{ flex: 1 }}>
              <Shimmer w={170} h={24} r={8} style={{ marginBottom: 24 }} />

              {/* Additional Discount */}
              <div style={{ marginBottom: 24 }}>
                <Shimmer w={150} h={16} r={4} style={{ marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 12 }}>
                  <Shimmer w="48%" h={48} r={10} />
                  <Shimmer w="48%" h={48} r={10} />
                </div>
              </div>

              {/* Additional Charges */}
              <div style={{ marginBottom: 32 }}>
                <Shimmer w={170} h={16} r={4} style={{ marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Shimmer w="60%" h={52} r={10} />
                  <Shimmer w={140} h={52} r={10} />
                  <Shimmer w={100} h={52} r={10} />
                </div>
              </div>

              {/* Upload */}
              <div>
                <Shimmer w={140} h={16} r={4} style={{ marginBottom: 12 }} />
                <div style={{ height: 130, border: "2px dashed #d0d0d0", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shimmer w={56} h={56} r={12} />
                </div>
              </div>
            </div>

            {/* Right - Summary */}
            <div style={{ width: 420, background: "#FAFAFA", borderRadius: 16, padding: 24 }}>
              {/* Summary lines */}
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <Shimmer w={i === 6 ? 190 : 150} h={22} r={6} />
                  <Shimmer w={90} h={22} r={6} />
                </div>
              ))}

              <div style={{ height: 1, background: "#ddd", margin: "20px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                <Shimmer w={180} h={32} r={8} />
                <Shimmer w={130} h={38} r={8} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <Shimmer w={20} h={20} r={4} />
                <Shimmer w={120} h={18} r={4} />
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
                <div style={{ flex: 1 }}>
                  <Shimmer w={100} h={16} r={4} style={{ marginBottom: 8 }} />
                  <Shimmer w="100%" h={48} r={10} />
                </div>
                <div style={{ flex: 1 }}>
                  <Shimmer w={100} h={16} r={4} style={{ marginBottom: 8 }} />
                  <Shimmer w="100%" h={48} r={10} />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
                <Shimmer w={110} h={48} r={10} />
                <div style={{ width: 180, height: 48, background: "#1F7FFF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shimmer w={140} h={22} r={6} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;