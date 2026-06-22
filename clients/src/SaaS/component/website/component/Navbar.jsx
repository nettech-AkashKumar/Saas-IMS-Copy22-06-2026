import React from "react";
import Logo from "../assets/images/muncTM.svg";
import { Link } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  return (

    <nav
  className="navbar navbar-expand-lg custom-navbar sticky-top"
  style={{ zIndex: 1030 }}
>
  <div className="container">

    <Link
      className="navbar-brand d-flex align-items-center gap-2"
      to="/"
    >
      <img src={Logo} alt="Posing Logo" style={{ height: 34 }} />
    </Link>

    <button
      className="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#mainNav"
    >
      <span className="navbar-toggler-icon"></span>
    </button>

    <div className="collapse navbar-collapse" id="mainNav">

      <ul className="navbar-nav mx-auto gap-lg-4 gap-2 align-items-lg-center">

        <li className="nav-item">
          <a className="nav-link" href="#hero">
            Home
          </a>
        </li>

        <li className="nav-item">
          <a className="nav-link" href="#features">
            Feature
          </a>
        </li>

        <li className="nav-item">
          <a className="nav-link" href="#modules">
            Modules
          </a>
        </li>

        <li className="nav-item">
          <a className="nav-link" href="#pricing">
            Pricing
          </a>
        </li>

        <li className="nav-item">
          <a className="nav-link" href="#news">
            News
          </a>
        </li>

        <li className="nav-item">
          <a className="nav-link" href="#contact">
            Contact
          </a>
        </li>

      </ul>

      <div className="d-flex gap-3 saas-all-login">

        <a
          href="/all-login"
          className="nav-login-btn"
        >
          Login
        </a>

        <a
          href="/register-login-details"
          className="nav-signup-btn"
        >
          Sign Up Free
        </a>

      </div>

    </div>
  </div>
</nav>
    // <nav
    //   className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 sticky-top"
    //   style={{ zIndex: 1030 }}
    // >
    //   <div className="container">
    //     <Link
    //       className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4"
    //       to="/"
    //     >
    //       <img src={Logo} alt="Posing Logo" style={{ height: 32 }} />
    //     </Link>
    //     <button
    //       className="navbar-toggler"
    //       type="button"
    //       data-bs-toggle="collapse"
    //       data-bs-target="#mainNav"
    //     >
    //       <span className="navbar-toggler-icon"></span>
    //     </button>
    //     <div className="collapse navbar-collapse" id="mainNav">
    //       <ul className="navbar-nav mx-auto gap-lg-4 gap-2 align-items-lg-center">
    //         <li className="nav-item">
    //           <a className="nav-link fw-semibold" href="#hero">
    //             Home
    //           </a>
    //         </li>
    //         <li className="nav-item">
    //           <a className="nav-link fw-semibold" href="#features">
    //             Feature
    //           </a>
    //         </li>
    //         <li className="nav-item">
    //           <a className="nav-link fw-semibold" href="#modules">
    //             Modules
    //           </a>
    //         </li>
    //         <li className="nav-item">
    //           <a className="nav-link fw-semibold" href="#pricing">
    //             Pricing
    //           </a>
    //         </li>
    //         <li className="nav-item">
    //           <a className="nav-link fw-semibold" href="#news">
    //             News
    //           </a>
    //         </li>
    //         <li className="nav-item">
    //           <a className="nav-link fw-semibold" href="#contact">
    //             Contact
    //           </a>
    //         </li>
    //       </ul>
    //       <div className="d-flex gap-2">
    //         <a href="/all-login" className="btn btn-outline-primary px-4">
    //           Login
    //         </a>
    //         <a href="/register-login-details" className="btn btn-primary px-4">
    //           Sign Up Free
    //         </a>
    //       </div>
    //     </div>
    //   </div>
    // </nav>
  );
};

export default Navbar;
