// import React, { useEffect, useState } from "react";
// import { useSocket } from "../../../../Context/SocketContext";
// import { getPublicWebsiteHero } from "../../../services/adminApi";
// import "./hero.css";

// function HeroSection() {
//   const [hero, setHero] = useState(null);
//   const { connectSocket } = useSocket();

//   useEffect(() => {
//     // 🔥 Initial Load
//     console.log("📝 Public Website: Loading initial hero data...");
//     getPublicWebsiteHero()
//       .then((data) => {
//         console.log("✅ Public Website: Hero data loaded successfully:", data);
//         setHero(data);
//       })
//       .catch((err) => {
//         console.error("❌ Public Website: Failed to load hero:", err);
//       });

//     // 🔥 Socket Connect
//     console.log(
//       "🔌 Public Website: Attempting socket connection to:",
//       import.meta.env.VITE_API_URL,
//     );
//     const socket = connectSocket(import.meta.env.VITE_API_URL);

//     if (socket && socket.connected) {
//       console.log("✅ Public Website: Socket already connected");
//     } else {
//       console.log("⏳ Public Website: Socket connecting...");
//     }

//     socket.emit("join-website-room");
//     console.log("🌐 Public Website: Emitted join-website-room");

//     socket.on("cms-updated", (payload) => {
//       console.log("🔥 Public Website realtime update received:", payload);
//       if (payload.section === "hero") {
//         console.log("✨ Public Website: Updating hero content:", payload.data);
//         if (payload.data) {
//           setHero(payload.data);
//         }
//       }
//     });

//     return () => {
//       console.log("🧹 Public Website: Cleaning up socket listener");
//       socket.off("cms-updated");
//     };
//   }, []);

//   if (!hero) return null;

//   return (
//     <section className="hero">
//       <div className="hero-wrapper">
//         <div className="hero-content">
//           <span className="hero-badge">
//             <span className="badge-icon">✨</span>
//             Modern inventory control for growing teams
//           </span>

//           <h1 className="hero-title">
//             <span className="title-black">Telegrams Marketing</span>
//             <span className="title-blue">Made Easy For Businesses</span>
//           </h1>

//           <p className="hero-description">
//             {hero.subtitle ||
//               "Inform customers about your latest products, send bulk Telegram messages, and share special links or direct checkout options effortlessly."}
//           </p>

//           <div className="hero-cta-buttons">
//             <a href={hero.primaryUrl || "#"} className="btn-primary-large">
//               {hero.primaryText || "Get Started"}
//               <span className="arrow">→</span>
//             </a>
//             <a href={hero.secondaryUrl || "#"} className="btn-secondary">
//               {hero.secondaryText || "Learn More"}
//             </a>
//           </div>
//         </div>

//         <div className="hero-side-cards">
//           <div className="side-card left-card">
//             <img
//               src={hero.imageUrl || "/default-hero.png"}
//               alt="Feature preview"
//             />
//           </div>
//           <div className="hero-phone-frame">
//             <img src={hero.imageUrl || "/default-hero.png"} alt="App preview" />
//           </div>
//           <div className="side-card right-card">
//             <img
//               src={hero.imageUrl || "/default-hero.png"}
//               alt="Feature preview"
//             />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// export default HeroSection;

import React, { useEffect, useState } from "react";
import { useSocket } from "../../../../Context/SocketContext";
import { getPublicWebsiteHero } from "../../../services/adminApi";
import "./hero.css";

function HeroSection() {
  const [hero, setHero] = useState(null);
  const { connectSocket } = useSocket();

  useEffect(() => {
    getPublicWebsiteHero()
      .then((data) => {
        setHero(data);
      })
      .catch((err) => {
        console.error(err);
      });

    const socket = connectSocket(import.meta.env.VITE_API_URL);

    socket.emit("join-website-room");

    socket.on("cms-updated", (payload) => {
      if (payload.section === "hero") {
        setHero(payload.data);
      }
    });

    return () => {
      socket.off("cms-updated");
    };
  }, []);

  if (!hero) return null;

  const templateType = hero.templateType || "modern";
  const titleLines = hero.title?.split("\n") || [""];

  const slotImages = Array.isArray(hero.imageUrls)
    ? hero.imageUrls.reduce((map, item) => {
        if (item?.slot && item?.url) {
          map[item.slot] = item.url;
        }
        return map;
      }, {})
    : {};

  const leftImage = slotImages.left || hero.imageUrl || "/default-hero.png";
  const phoneImage = slotImages.phone || hero.imageUrl || "/default-hero.png";
  const rightImage = slotImages.right || hero.imageUrl || "/default-hero.png";
  const classicImage =
    hero.imageUrl || slotImages.default || "/default-hero.png";

  if (templateType === "classic") {
    return (
      <div
        style={{ background: "#f4f7fb", padding: "80px 10%", borderRadius: 18 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 60,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 550, flex: 1, minWidth: 320 }}>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "#1d4ed8",
                lineHeight: 1.1,
                marginBottom: 30,
              }}
            >
              {titleLines.map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < titleLines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </h1>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 30,
              }}
            >
              {hero.features &&
                hero.features.map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{ color: "#2563eb", fontSize: 20, marginTop: 4 }}
                    >
                      &#10003;
                    </span>
                    <div>
                      <strong
                        style={{
                          fontSize: 14,
                          color: "#1f2937",
                          display: "block",
                        }}
                      >
                        {feature.title}
                      </strong>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          margin: "4px 0 0 0",
                        }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
              <a
                href={hero.primaryUrl || "#"}
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: 4,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                {hero.primaryText || "Get Started"}
              </a>
              <a
                href={hero.secondaryUrl || "#"}
                style={{
                  background: "white",
                  color: "#2563eb",
                  border: "1px solid #2563eb",
                  padding: "10px 22px",
                  borderRadius: 4,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                {hero.secondaryText || "Learn More"}
              </a>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 320,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={classicImage}
              alt={hero.imageAlt || "Hero preview"}
              style={{ width: 520, maxWidth: "100%", borderRadius: 8 }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Default to modern template
  return (
    // <section className="hero">
    //   <div className="hero-wrapper">
    //     {/* CONTENT */}
    //     <div className="hero-content">
    //       <span className="hero-badge">
    //         <span className="badge-icon">✈</span>
    //         Connect with bunch of channel owners
    //       </span>

    //       <h1 className="hero-title">
    //         {titleLines.map((line, index) => (
    //           <React.Fragment key={index}>
    //             <span className="title-blue">{line}</span>
    //           </React.Fragment>
    //         ))}
    //       </h1>

    //       <p className="hero-description">
    //         {hero.subtitle ||
    //           "Inform customers about your latest products, send bulk Telegram messages, and share special links or direct checkout option effortlessly."}
    //       </p>

    //       <div className="hero-cta-buttons">
    //         <a href={hero.primaryUrl || "#"} className="btn-primary-large">
    //           {hero.primaryText || "Start your campaign"}

    //           <span className="arrow-circle">→</span>
    //         </a>
    //         <a href={hero.secondaryUrl || "#"} className="btn-primary-large">
    //           {hero.secondaryText || "Learn More"}

    //           <span className="arrow-circle">→</span>
    //         </a>
    //       </div>
    //     </div>

    //     {/* VISUALS */}
    //     <div className="hero-visuals">
    //       {/* LEFT CARD */}
    //       <div className="left-floating-card">
    //         <img src={leftImage} alt="left-card" />
    //       </div>

    //       {/* PHONE */}
    //       <div className="hero-phone-frame">
    //         <img src={phoneImage} alt="phone" />
    //       </div>

    //       {/* RIGHT CARD */}
    //       <div className="right-floating-card">
    //         <img src={rightImage} alt="right-card" />
    //       </div>
    //     </div>
    //   </div>
    // </section>
    <section className="hero">
      <div className="hero-wrapper">
        {/* CONTENT */}
        <div className="hero-content">
          <span className="hero-badge">
            <span className="badge-icon">✈</span>
            Connect with bunch of channel owners
          </span>

          <h1 className="hero-title">
            <span className="title-blue">{hero.title}</span>
          </h1>

          <p className="hero-description">
            {hero.subtitle ||
              "Inform customers about your latest products, send bulk Telegram messages, and share special links or direct checkout option effortlessly."}
          </p>

          <div className="hero-cta-buttons">
            <a href={hero.primaryUrl || "#"} className="btn-primary-large">
              {hero.primaryText || "Start your campaign"}

              <span className="arrow-circle">→</span>
            </a>
            <a href={hero.secondaryUrl || "#"} className="btn-primary-large">
              {hero.secondaryText || "Learn More"}

              <span className="arrow-circle">→</span>
            </a>
          </div>
        </div>

        {/* VISUALS */}
        <div className="hero-visuals">
          {/* LEFT CARD */}
          <div className="left-floating-card">
            <img src={leftImage || "/default-hero.png"} alt="left-card" />
          </div>

          {/* PHONE */}
          <div className="hero-phone-frame">
            <img src={phoneImage || "/default-hero.png"} alt="phone" />
          </div>

          {/* RIGHT CARD */}
          <div className="right-floating-card">
            <img src={rightImage || "/default-hero.png"} alt="right-card" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
