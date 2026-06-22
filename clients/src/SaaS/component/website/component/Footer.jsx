import React from "react";
import "./footer.css";
import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaXTwitter,
} from "react-icons/fa6";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Useful Links */}

        <div className="footer-col">
          <h3>Useful Links</h3>

          {/* <ul>
            <li>Home</li>
            <li>About Us</li>

            <li>
              Career <span className="tag hiring">HIRING!</span>
            </li>

            <li>Insights & Blogs</li>
            <li>Contact Us</li>
            <li>Terms & Conditions</li>
            <li>Privacy Policy</li>
            <li>Refund Policy</li>
          </ul> */}
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About Us</Link>
            </li>

            <li>
              <Link to="/career">
                Career <span className="tag hiring">HIRING!</span>
              </Link>
            </li>

            <li>
              <Link to="/blogs">Insights & Blogs</Link>
            </li>
            <li>
              <Link to="/contact">Contact Us</Link>
            </li>
            <li>
              <Link to="/terms-conditions">Terms & Conditions</Link>
            </li>
            <li>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/refund-policy">Refund Policy</Link>
            </li>
          </ul>
        </div>

        {/* Other Products */}

        <div className="footer-col">
          <h3>Other Products</h3>

          {/* <ul>
            <li>HR Management System</li>
            <li>Lead Management System</li>
            <li>Inventory Management System</li>

            <li>
              School Management System
              <span className="tag soon">SOON</span>
            </li>

            <li>
              Hotel Management System
              <span className="tag soon">SOON</span>
            </li>

            <li>
              Chat App
              <span className="tag soon">SOON</span>
            </li>
          </ul> */}
          <ul>
            <li>
              <a href="https://kasperinfotech.io">HR Management System</a>
            </li>

            <li>
              <a
                href="https://kasperinfotech.in/home"
                target="_blank"
                rel="noopener noreferrer"
              >
                Lead Management System
              </a>
            </li>

            <li>
              <a href="/school-management-system">
                School Management System <span className="tag soon">SOON</span>
              </a>
            </li>

            <li>
              <a href="/hotel-management-system">
                Hotel Management System <span className="tag soon">SOON</span>
              </a>
            </li>

            <li>
              <a href="/chat-app">
                Chat App <span className="tag soon">SOON</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Address */}

        <div className="footer-col">
          <h3>Address</h3>

          <p>
            Office Number 503, TOWER-C, The iThum Towers, Sector 62, Noida,
            Uttar Pradesh 201301
          </p>

          <h3>Contact Details</h3>

          <p>info@kasperinfotech.com</p>
          <p>sales@kasperinfotech.com</p>
          <p>+91 800-644-8800</p>
        </div>
      </div>

      {/* Bottom Card */}

      <div className="footer-bottom">
        <div className="footer-logo">
          <h2>MUN-C™</h2>

          <p>© Copyright 2016-2026. All Rights Reserved.</p>
        </div>

        {/* <div className="footer-social">
          <button className="follow-btn">Follow Us</button>

          <FaXTwitter />
          <FaLinkedin />
          <FaInstagram />
          <FaFacebook />
        </div> */}
        <div className="footer-social">
          <button className="follow-btn">Follow Us</button>

          {/* <a
    href="#"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Twitter"
  >
    <FaXTwitter />
  </a> */}

          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin />
          </a>

          <a
            href="https://www.instagram.com/munc_bms/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>

          <a
            href="https://www.facebook.com/profile.php?id=61573443763703&sk=directory_personal_details"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <FaFacebook />
          </a>
        </div>
      </div>
    </footer>
  );
}
