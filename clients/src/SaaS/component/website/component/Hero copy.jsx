import React, { useEffect, useState } from "react";
import { useSocket } from "../../../../Context/SocketContext";
import { getPublicWebsiteHero } from "../../../services/adminApi";
import "./hero.css";

function HeroSection() {
  const [hero, setHero] = useState(null);
  const { connectSocket } = useSocket();

  useEffect(() => {
    // 🔥 Initial Load
    console.log("📝 Public Website: Loading initial hero data...");
    getPublicWebsiteHero()
      .then((data) => {
        console.log("✅ Public Website: Hero data loaded successfully:", data);
        setHero(data);
      })
      .catch((err) => {
        console.error("❌ Public Website: Failed to load hero:", err);
      });

    // 🔥 Socket Connect
    console.log(
      "🔌 Public Website: Attempting socket connection to:",
      import.meta.env.VITE_API_URL,
    );
    const socket = connectSocket(import.meta.env.VITE_API_URL);

    if (socket && socket.connected) {
      console.log("✅ Public Website: Socket already connected");
    } else {
      console.log("⏳ Public Website: Socket connecting...");
    }

    socket.emit("join-website-room");
    console.log("🌐 Public Website: Emitted join-website-room");

    socket.on("cms-updated", (payload) => {
      console.log("🔥 Public Website realtime update received:", payload);
      if (payload.section === "hero") {
        console.log("✨ Public Website: Updating hero content:", payload.data);
        if (payload.data) {
          setHero(payload.data);
        }
      }
    });

    return () => {
      console.log("🧹 Public Website: Cleaning up socket listener");
      socket.off("cms-updated");
    };
  }, []);

  if (!hero) return null;

  return (
    <section className="hero">
      <div className="hero-wrapper">
        <div className="hero-content">
          <span className="hero-badge">
            <span className="badge-icon">✨</span>
            Modern inventory control for growing teams
          </span>

          <h1 className="hero-title">
            <span className="title-black">Telegrams Marketing</span>
            <span className="title-blue">Made Easy For Businesses</span>
          </h1>

          <p className="hero-description">
            {hero.subtitle ||
              "Inform customers about your latest products, send bulk Telegram messages, and share special links or direct checkout options effortlessly."}
          </p>

          <div className="hero-cta-buttons">
            <a href={hero.primaryUrl || "#"} className="btn-primary-large">
              {hero.primaryText || "Get Started"}
              <span className="arrow">→</span>
            </a>
            <a href={hero.secondaryUrl || "#"} className="btn-secondary">
              {hero.secondaryText || "Learn More"}
            </a>
          </div>
        </div>

        <div className="hero-side-cards">
          <div className="side-card left-card">
            <img
              src={hero.imageUrl || "/default-hero.png"}
              alt="Feature preview"
            />
          </div>
          <div className="hero-phone-frame">
            <img src={hero.imageUrl || "/default-hero.png"} alt="App preview" />
          </div>
          <div className="side-card right-card">
            <img
              src={hero.imageUrl || "/default-hero.png"}
              alt="Feature preview"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;



// tamplate bsed design
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
import { FiCheckCircle } from "react-icons/fi";

const HeroVariantModern = ({ hero }) => {
  const badgeText =
    hero.badgeText || "Modern inventory control for growing teams";

  return (
    <>
      <div className="hero-content">
        <span className="hero-badge">
          <span className="badge-icon">✈</span>
          {badgeText}
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

      <div className="hero-visuals">
        <div className="left-floating-card">
          <img src={hero.imageUrl || "/default-hero.png"} alt="left-card" />
        </div>
        <div className="hero-phone-frame">
          <img src={hero.imageUrl || "/default-hero.png"} alt="phone" />
        </div>
        <div className="right-floating-card">
          <img src={hero.imageUrl || "/default-hero.png"} alt="right-card" />
        </div>
      </div>
    </>
  );
};

const HeroVariantClassic = ({ hero }) => {
  const titleLines = hero.title?.split("\n") || [""];

  return (
    <div className="hero-classic">
      <div className="hero-classic-grid">
        <div className="hero-classic-copy">
          <span className="hero-classic-label">Hero Template Preview</span>

          <h1 className="hero-classic-title">
            {titleLines.map((line, index) => (
              <span key={index}>{line}</span>
            ))}
          </h1>

          <p className="hero-classic-description">{hero.subtitle}</p>

          <div className="hero-classic-cta">
            <a href={hero.primaryUrl || "#"} className="btn-primary-classic">
              {hero.primaryText || "Get Started"}
            </a>
            <a
              href={hero.secondaryUrl || "#"}
              className="btn-secondary-classic"
            >
              {hero.secondaryText || "Learn More"}
            </a>
          </div>
        </div>

        <div className="hero-classic-gallery">
          <div className="hero-classic-card">
            <img
              src={hero.imageUrl || "/default-hero.png"}
              alt={hero.imageAlt || "Hero preview"}
            />
          </div>
          <div className="hero-classic-card">
            <img
              src={hero.imageUrl || "/default-hero.png"}
              alt={hero.imageAlt || "Hero preview"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

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

  return (
    <section className="hero">
      <div className="hero-wrapper">
        {templateType === "classic" ? (
          <HeroVariantClassic hero={hero} />
        ) : (
          <HeroVariantModern hero={hero} />
        )}
      </div>
    </section>
  );
}

export default HeroSection;
