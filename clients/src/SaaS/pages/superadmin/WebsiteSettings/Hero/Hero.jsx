import React, { useEffect, useState } from "react";
import defaultHeroImage from "../../../../component/website/assets/images/hero.png";
import {
  getAllHeroContents,
  createHeroContent,
  updateHeroContent,
  deleteHeroContent,
} from "../../../../services/adminApi";
import HeroEditor from "./HeroEditor";
import HeroDesign from "./HeroDesign";
import BASE_URL from "../../../../services/config/config";
import "../../SuperAdminDashboard.css";
import { useSocket } from "../../../../../Context/SocketContext";

const Hero = () => {
  const { connectSocket } = useSocket();
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedHero, setSelectedHero] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // list | edit
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pendingHeroId, setPendingHeroId] = useState(null);

  //   useEffect(() => {
  //     loadHeroes();
  //   }, []);

  const loadHeroes = async () => {
    try {
      setLoading(true);
      const res = await getAllHeroContents();
      setHeroes(res || []);
    } catch (err) {
      console.warn("Failed to load hero sections", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeroes();

    const socket = connectSocket(import.meta.env.VITE_API_URL);

    if (socket && socket.connected) {
      console.log(
        "✅ Admin Dashboard: Socket connected, setting up CMS listener",
      );
    } else {
      console.log(
        "⏳ Admin Dashboard: Socket connecting, waiting for connection...",
      );
    }

    // Listen for hero updates from other admins
    socket.on("cms-updated", (payload) => {
      console.log("📡 Admin Dashboard received cms-updated:", payload);
      if (payload.section === "hero") {
        console.log("🔄 Reloading heroes...");
        loadHeroes();
      }
    });

    return () => {
      console.log("🧹 Cleaning up CMS listener from admin dashboard");
      socket.off("cms-updated");
    };
  }, []);


  const handleCreateNew = () => {
    setSelectedHero(null);
    setIsCreating(true);
    setViewMode("edit");
  };

  const handleSelectHero = (heroData) => {
    setSelectedHero(heroData);
    setIsCreating(false);
    setViewMode("edit");
  };

  const handleSaveHero = async (payload, heroId) => {
    try {
      setSaving(true);

      if (isCreating) {
        await createHeroContent(payload);
        alert("Hero section created successfully.");
      } else {
        await updateHeroContent(heroId, payload);
        alert("Hero section updated successfully.");
      }

      await loadHeroes();
      setViewMode("list");
      setSelectedHero(null);
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not save hero content");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHero = async (heroId) => {
    if (!window.confirm("Are you sure you want to delete this hero section?")) {
      return;
    }

    try {
      await deleteHeroContent(heroId);
      alert("Hero section deleted successfully.");
      await loadHeroes();
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not delete hero section");
    }
  };

  const handleSetActive = (heroId) => {
    setPendingHeroId(heroId);
    setShowPasswordModal(true);
    setPassword("");
    setPasswordError("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setVerifying(true);

    try {
      const response = await fetch(`${BASE_URL}/api/hero/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // Password verified - now set hero as active
        await updateHeroContent(pendingHeroId, { isActive: true });
        alert("Hero section set as active on website!");
        await loadHeroes();
        setShowPasswordModal(false);
        setPassword("");
        setPendingHeroId(null);
      } else {
        const data = await response.json();
        setPasswordError(data.message || "Invalid password");
      }
    } catch (error) {
      setPasswordError("Error verifying password. Please try again.");
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedHero(null);
    setIsCreating(false);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPassword("");
    setPasswordError("");
    setPendingHeroId(null);
  };

  return (
    <main className="sa-main">
      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 40,
              borderRadius: 12,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              maxWidth: 400,
              width: "90%",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: 20, color: "#1d4ed8" }}>
              Verify Password
            </h2>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>
              Enter super admin password to set this hero as active on the
              public website
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={verifying}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  marginBottom: 12,
                  boxSizing: "border-box",
                }}
                autoFocus
              />

              {passwordError && (
                <p
                  style={{
                    color: "#dc3545",
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  {passwordError}
                </p>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={verifying}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: verifying ? "not-allowed" : "pointer",
                    opacity: verifying ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || !password}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: verifying || !password ? "not-allowed" : "pointer",
                    opacity: verifying || !password ? 0.6 : 1,
                  }}
                >
                  {verifying ? "Verifying..." : "Verify & Set Active"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <header className="sa-topbar">
        <div className="sa-topbar__left">
          <div>
            <p className="sa-eyebrow">Super Admin Dashboard</p>

            <h1>
              {viewMode === "list"
                ? "Website Hero Sections"
                : isCreating
                  ? "Create Hero Section"
                  : "Edit Hero Section"}
            </h1>
          </div>
        </div>

        {viewMode === "list" && (
          <div className="sa-topbar__right">
            <button
              type="button"
              onClick={handleCreateNew}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                border: "none",
                background: "#2f7dff",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Create New Hero
            </button>
          </div>
        )}
      </header>

      {/* LIST VIEW */}
      {viewMode === "list" ? (
        <section className="sa-panel">
          {loading ? (
            <p>Loading hero sections...</p>
          ) : heroes.length === 0 ? (
            <div className="sa-empty-state">
              <p>No hero sections found. Create your first hero section!</p>

              <button
                type="button"
                onClick={handleCreateNew}
                style={{
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: "none",
                  background: "#2f7dff",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Create Hero Section
              </button>
            </div>
          ) : (
            <div className="sa-hero-list">
              {heroes.map((heroItem) => (
                <div key={heroItem._id} className="sa-hero-card">
                  {/* CARD HEADER */}
                  {/* <div className="sa-hero-card__header">
                    <h3>{heroItem.name}</h3>

                    {heroItem.isActive && (
                      <span className="sa-badge sa-badge--active">Active</span>
                    )}
                  </div> */}

                  {/* HERO DESIGN PREVIEW */}
                  <div style={{ marginBottom: 20 }}>
                    <HeroDesign
                      hero={heroItem}
                      displayImage={heroItem.imageUrl || defaultHeroImage}
                    />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="sa-hero-card__actions">
                    <button
                      type="button"
                      onClick={() => handleSelectHero(heroItem)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #2f7dff",
                        background: "transparent",
                        color: "#2f7dff",
                        cursor: "pointer",
                        marginRight: 8,
                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetActive(heroItem._id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: heroItem.isActive
                          ? "none"
                          : "1px solid #28a745",
                        background: heroItem.isActive
                          ? "#28a745"
                          : "transparent",
                        color: heroItem.isActive ? "white" : "#28a745",
                        cursor: "pointer",
                        marginRight: 8,
                        fontWeight: heroItem.isActive ? 600 : 500,
                      }}
                    >
                      {heroItem.isActive ? "✓ Active" : "Set Active"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteHero(heroItem._id)}
                      disabled={heroes.length === 1}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "#dc3545",
                        color: "#fff",
                        cursor: heroes.length === 1 ? "not-allowed" : "pointer",
                        opacity: heroes.length === 1 ? 0.5 : 1,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* EDITOR VIEW */
        <HeroEditor
          heroData={selectedHero}
          isCreating={isCreating}
          onSave={handleSaveHero}
          onCancel={handleCancel}
          isSaving={saving}
        />
      )}
    </main>
  );
};

export default Hero;

// import React, { useEffect, useState } from "react";
// import defaultHeroImage from "../../../../component/website/assets/images/hero.png";
// import {
//   getAllHeroContents,
//   createHeroContent,
//   updateHeroContent,
//   deleteHeroContent,
// } from "../../../../services/adminApi";
// import HeroEditor from "./HeroEditor";
// import "../../SuperAdminDashboard.css";

// const Hero = () => {
//   const [heroes, setHeroes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [selectedHero, setSelectedHero] = useState(null);
//   const [isCreating, setIsCreating] = useState(false);
//   const [viewMode, setViewMode] = useState("list"); // "list" or "edit"

//   useEffect(() => {
//     loadHeroes();
//   }, []);

//   const loadHeroes = async () => {
//     try {
//       setLoading(true);
//       const res = await getAllHeroContents();
//       setHeroes(res);
//     } catch (err) {
//       console.warn("Failed to load hero sections", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateNew = () => {
//     setSelectedHero(null);
//     setIsCreating(true);
//     setViewMode("edit");
//   };

//   const handleSelectHero = (heroData) => {
//     setSelectedHero(heroData);
//     setIsCreating(false);
//     setViewMode("edit");
//   };

//   const handleSaveHero = async (payload, heroId) => {
//     try {
//       setSaving(true);
//       if (isCreating) {
//         await createHeroContent(payload);
//         alert("Hero section created successfully.");
//       } else {
//         await updateHeroContent(heroId, payload);
//         alert("Hero section updated successfully.");
//       }
//       await loadHeroes();
//       setViewMode("list");
//       setSelectedHero(null);
//       setIsCreating(false);
//     } catch (err) {
//       console.error(err);
//       alert(err.message || "Could not save hero content");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDeleteHero = async (heroId) => {
//     if (!confirm("Are you sure you want to delete this hero section?")) {
//       return;
//     }

//     try {
//       await deleteHeroContent(heroId);
//       alert("Hero section deleted successfully.");
//       await loadHeroes();
//     } catch (err) {
//       console.error(err);
//       alert(err.message || "Could not delete hero section");
//     }
//   };

//   const handleCancel = () => {
//     setViewMode("list");
//     setSelectedHero(null);
//     setIsCreating(false);
//   };

//   return (
//     <main className="sa-main">
//       <header className="sa-topbar">
//         <div className="sa-topbar__left">
//           <div>
//             <p className="sa-eyebrow">Super Admin Dashboard</p>
//             <h1>
//               {viewMode === "list"
//                 ? "Website Hero Sections"
//                 : isCreating
//                   ? "Create Hero Section"
//                   : "Edit Hero Section"}
//             </h1>
//           </div>
//         </div>
//         {viewMode === "list" && (
//           <div className="sa-topbar__right">
//             <button
//               type="button"
//               onClick={handleCreateNew}
//               style={{
//                 padding: "12px 18px",
//                 borderRadius: 12,
//                 border: "none",
//                 background: "#2f7dff",
//                 color: "#fff",
//                 cursor: "pointer",
//               }}
//             >
//               Create New Hero
//             </button>
//           </div>
//         )}
//       </header>

//       {viewMode === "list" ? (
//         <section className="sa-panel">
//           {loading ? (
//             <p>Loading hero sections...</p>
//           ) : heroes.length === 0 ? (
//             <div className="sa-empty-state">
//               <p>No hero sections found. Create your first hero section!</p>
//               <button
//                 type="button"
//                 onClick={handleCreateNew}
//                 style={{
//                   padding: "12px 18px",
//                   borderRadius: 12,
//                   border: "none",
//                   background: "#2f7dff",
//                   color: "#fff",
//                   cursor: "pointer",
//                 }}
//               >
//                 Create Hero Section
//               </button>
//             </div>
//           ) : (
//             <div className="sa-hero-list">
//               {heroes.map((heroItem) => (
//                 <div key={heroItem._id} className="sa-hero-card">
//                   <div className="sa-hero-card__header">
//                     <h3>{heroItem.name}</h3>
//                     {heroItem.isActive && (
//                       <span className="sa-badge sa-badge--active">Active</span>
//                     )}
//                   </div>
//                   <div className="sa-hero-card__preview">
//                     <img
//                       src={heroItem.imageUrl || defaultHeroImage}
//                       alt={heroItem.imageAlt}
//                       style={{ width: "100%", maxWidth: 200, borderRadius: 8 }}
//                     />
//                     <div className="sa-hero-card__content">
//                       <h4>{heroItem.title.split("\n")[0]}</h4>
//                       <p>{heroItem.subtitle.substring(0, 100)}...</p>
//                     </div>
//                   </div>

//                   {/* <div className="sa-hero-card__actions">
//                     <button
//                       type="button"
//                       onClick={() => handleSelectHero(heroItem)}
//                       style={{
//                         padding: "8px 12px",
//                         borderRadius: 8,
//                         border: "1px solid #2f7dff",
//                         background: "transparent",
//                         color: "#2f7dff",
//                         cursor: "pointer",
//                         marginRight: 8,
//                       }}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => handleDeleteHero(heroItem._id)}
//                       disabled={heroes.length === 1}
//                       style={{
//                         padding: "8px 12px",
//                         borderRadius: 8,
//                         border: "none",
//                         background: "#dc3545",
//                         color: "#fff",
//                         cursor: heroes.length === 1 ? "not-allowed" : "pointer",
//                         opacity: heroes.length === 1 ? 0.5 : 1,
//                       }}
//                     >
//                       Delete
//                     </button>
//                   </div> */}
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       ) : (
//         <HeroEditor
//           heroData={selectedHero}
//           isCreating={isCreating}
//           onSave={handleSaveHero}
//           onCancel={handleCancel}
//           isSaving={saving}
//         />
//       )}
//     </main>
//   );
// };

// export default Hero;
