import React from 'react'
import Rewardslogo from '../../../assets/images/rewardslogo.png'
import { MdAddShoppingCart } from "react-icons/md";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { LuCalendarMinus2 } from "react-icons/lu";
import { FiUpload, FiCheck, FiChevronDown } from "react-icons/fi";
import { Link } from 'react-router-dom';
import { hasPermission } from '../../../utils/permission/hasPermission';
import { useAuth } from "../../auth/AuthContext";

function EmptyOcd() {
  const { user } = useAuth();
  return (
    <div
      className=''
      style={{
        width: '100%',
        height: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: 'auto',
      }}
    >

      {/* Header */}
      {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
        }}>
          <div style={{
            width: 32,
            height: 32,
            background: 'white',
            borderRadius: 53,
            border: '1.07px solid #EAEAEA',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <FaArrowLeft style={{ color: '#A2A8B8' }} />
          </div>

          <h2 style={{
            margin: 0,
            color: 'black',
            fontSize: 22,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            lineHeight: '26.4px',
          }}>
            Shopping Points
          </h2>
        </div>

        <div style={{ display: 'flex', height: '40px', border: '1px solid #EAEAEA', borderRadius: '8px', }}>
          
        </div>
      </div> */}

      <div style={{
        marginTop: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* Text Content */}
        <div style={{ textAlign: 'center', maxWidth: '680px', padding: '0 20px', zIndex: 10 }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 20px 0',
            }}
          >
            Rewards & Points
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#727681',
              lineHeight: '1.7',
              marginBottom: '40px',
            }}
          >
            Build stronger customer loyalty by letting them earn rewards with every purchase.<br /><br />
            You haven’t created any shopping points yet — click below to set up your first one and start engaging customers today!
          </p>



        </div>

        {/* Gift Box Illustration */}
        <div
          style={{
            width: '240px',
            height: '240px',
            position: 'relative',
            marginBottom: '40px',
            objectFit: 'contain',
          }}
        >
          <img src={Rewardslogo} alt='Reward Logo' style={{ width: '100%' }} />
        </div>

        {/* Create Button */}
        {hasPermission(user, "PointsRewards", "create") && (
        <Link
          to="/createshoppingpoints"
          style={{
            padding: '6px 36px',
            background: '#1F7FFF',
            color: 'white',
            fontSize: '18px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            boxShadow: '0 8px 25px rgba(31, 127, 255, 0.3), inset -1px -1px 6px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(31, 127, 255, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(31, 127, 255, 0.3), inset -1px -1px 6px rgba(0,0,0,0.2)';
          }}
        >
          {/* Sparkle Icon */}
          <MdAddShoppingCart style={{ fontSize: '24px' }} />
          Create Shopping Points
        </Link>
        )}

      </div>

    </div>
  )
}

export default EmptyOcd