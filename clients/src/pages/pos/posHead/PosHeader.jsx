import React, { useEffect, useState } from 'react'
import { AiOutlineMenuFold, AiOutlineMenuUnfold } from 'react-icons/ai';
import { Link } from 'react-router-dom';
import { useSidebar } from '../../../Context/sidetoggle/SidebarContext';
import { TbCalculator, TbCash, TbChartInfographic, TbMaximize, TbPrinter, TbProgress, TbSettings } from 'react-icons/tb';
import Mundc from "../../../assets/img/logo/munclogotm.png"
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BASE_URL from '../../config/config';
import axios from 'axios';
import api from "../../../pages/config/axiosInstance"
import { useAuth } from '../../../components/auth/AuthContext';
import { RiLogoutBoxRLine } from "react-icons/ri";
import { SlCalculator } from "react-icons/sl";
import { CgFileDocument } from "react-icons/cg";
import { FaPause } from "react-icons/fa6";
import { CiBarcode } from "react-icons/ci";
import { MdOutlineSort } from "react-icons/md";

const PosHeader = () => {
  const { openMenus, toggleMenu, mobileOpen, handleMobileToggle, handleLinkClick } = useSidebar();

  const [companyImages, setCompanyImages] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  // const token = localStorage.getItem("token");
  //   const menuData = getMenuData();
  // fetch company details
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      // const token = localStorage.getItem("token");
      try {
        const res = await api.get('/api/companyprofile/get')
        if (res.status === 200) {
          setCompanyImages(res.data.data)
          // console.log("res.data from pos header", res.data.data)
        }
      } catch (error) {    
  console.error("API fetch error:", error.response ? error.response.data : error.message);
        toast.error("Unable to find company details", {
          position: 'top-center'
        })
      }
    }
    fetchCompanyDetails();
  }, []);
  // console.log("Token:", token)
// console.log("Fetching from:", `${BASE_URL}/api/companyprofile/get`)

  return (
    <>
    <div className="">
      {/* {companyImages ? (
        <>
              <div
                style={{
                  width: "100%",
                  height: "67px",
                  paddingLeft: 20,
                  paddingRight: 20,
                  background: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: "270px",
                  objectFit: 'contain',
                  padding: '5px',
                }}>
                  <img
                    style={{ height: "100%" }}
                    src={isDarkMode ? companyImages?.companyDarkLogo : companyImages?.companyLogo}
                    alt="Company logo"
                  />
                </div>
      
                <div
                  style={{
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 12,
                    display: 'inline-flex',
                  }}
                >
                  <div
                    style={{
                      height: 41,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #D7D7D7 solid',
                      outlineOffset: '-1px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        overflow: 'hidden',
                      }}
                    >
                      <CiBarcode className='fs-5 text-secondary' />
                    </div>
                  </div>
      
                  <div
                    style={{
                      height: 41,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #D7D7D7 solid',
                      outlineOffset: '-1px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <a href='/pos' target='_blank'
                      style={{
                        overflow: 'hidden',
                      }}
                    >
                      <FaPause className='fs-5 text-secondary' />
                    </a>
                  </div>
      
                  <div
                    style={{
                      height: 41,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #D7D7D7 solid',
                      outlineOffset: '-1px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        overflow: 'hidden',
                      }}
                    >
                      <CgFileDocument className='fs-5 text-secondary' />
                    </div>
                  </div>
      
                  <div
                    style={{
                      height: 41,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #D7D7D7 solid',
                      outlineOffset: '-1px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        overflow: 'hidden',
                      }}
                    >
                      <SlCalculator className='fs-5 text-secondary' />
                    </div>
                  </div>
      
                  <div
                    style={{
                      height: 41,
                      paddingLeft: 12,
                      paddingRight: 12,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'white',
                      borderRadius: 8,
                      outline: '1px #D7D7D7 solid',
                      outlineOffset: '-1px',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      display: 'inline-flex',
                    }}
                  >
                    <Link
                      to="/dashboard"
                      style={{
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        gap: 4,
                        display: 'inline-flex',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div
                        data-property-1="exit_to_app_18dp_1F1F1F_FILL0_wght400_GRAD0_opsz20 1"
                        style={{
                          width: 18,
                          height: 18,
                          display: 'flex',
                          gap: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <RiLogoutBoxRLine />
                      </div>
                      <div
                        style={{
                          color: 'black',
                          fontSize: 16,
                          fontFamily: 'Inter',
                          fontWeight: '400',
                          wordWrap: 'break-word',
                        }}
                      >
                        Exit
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
      </>
      ):(
      <p>"No Company Logo Image"</p>)} */}
    </div>
</>
  )
}

export default PosHeader
