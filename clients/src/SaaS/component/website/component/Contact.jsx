import React, { useEffect, useState } from "react";
import Select from "react-select";
import BASE_URL from "../../../services/config/config";
import "./contact.css";

export default function ContactSection() {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (countries.length === 0) return;

    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const found = countries.find((c) => c.countryCode === data.country);
        if (found) setSelectedCountry(found);
      });
  }, [countries]);

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!name || !email || !message)
      return alert("Please fill required fields");
    try {
      setSending(true);
      const res = await fetch(`${BASE_URL}/api/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, product, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit");

      alert("Message sent successfully");
      setName("");
      setEmail("");
      setPhone("");
      setProduct("");
      setMessage("");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="contact-modern">
      <div className="contact-header">
        <h2>Get In Touch</h2>
        <p>
          Your business matters to us. Contact our team anytime for support,
          demos, or partnerships.
        </p>
      </div>

      <div className="contact-container">
        {/* LEFT SIDE - CONTACT INFO */}
        <div className="contact-info">
          <div className="info-card">
            <span className="icon">📍</span>
            <div>
              <h4>Office Address</h4>
              <p>Sector 62, Noida, Uttar Pradesh, India</p>
            </div>
          </div>

          <div className="info-card">
            <span className="icon">📞</span>
            <div>
              <h4>Mobile Number</h4>
              <p>+91 800-644-8800</p>
            </div>
          </div>

          <div className="info-card">
            <span className="icon">☎️</span>
            <div>
              <h4>Office Number</h4>
              <p>0120-4567890</p>
            </div>
          </div>

          <div className="info-card">
            <span className="icon">📧</span>
            <div>
              <h4>Support Email</h4>
              <p>support@imsmymunc.com</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Enter your name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Enter email"
              />
            </div>

            <div className="form-group">
              <label>Phone *</label>
              <div className="phone-box">
                <span>+91</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="text"
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Product</label>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              <option value="">Select Product</option>
              <option>Inventory Management</option>
              <option>Lead Management</option>
            </select>
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help you?"
            ></textarea>
          </div>

          <button disabled={sending} className="submit-btn">
            {sending ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
}

// import React from "react";
// import "./contact.css";

// export default function ContactSection() {
//   return (
//     <section className="contact">
//       <div className="contact-header">
//         <h2 className="title">Get In touch</h2>

//         <p>
//           Your business matters to us. Contact our team anytime for support,
//           demos, or partnerships.
//         </p>
//       </div>

//       <div className="contact-wrapper">
//         {/* LEFT FORM */}

//         <div className="contact-form">
//           <label>Full Name *</label>
//           <input type="text" placeholder="Enter Email Id" />

//           <div className="form-row">
//             <div className="form-group">
//               <label>Email Id *</label>
//               <input type="email" placeholder="Enter Email Id" />
//             </div>

//             <div className="form-group">
//               <label>Phone No *</label>
//               <div className="phone-box">
//                 <span>+91</span>
//                 <input type="text" placeholder="Enter Phone No." />
//               </div>
//             </div>
//           </div>

//           <label>Product</label>
//           <select>
//             <option>Select Product</option>
//             <option>Inventory Management</option>
//             <option>Lead Management</option>
//           </select>

//           <label>Message</label>
//           <textarea placeholder="How we can help you ?"></textarea>

//           <button className="submit">Submit</button>
//         </div>

//         {/* RIGHT IMAGE */}

//         <div className="contact-image">
//           <img
//             src="https://images.unsplash.com/photo-1518674660708-0e2c0473e68e"
//             alt="phone"
//           />
//         </div>
//       </div>
//     </section>
//   );
// }
