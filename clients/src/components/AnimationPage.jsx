import React, { useState, useEffect } from 'react';
import animation_cart from '../assets/images/animation-cart.gif';
import ChoosePlan from '../pages/Login&Create/ChoosePlan';

const AnimationPage = () => {
  const [showChoosePlan, setShowChoosePlan] = useState(false);

  // 👇 This will run after the component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowChoosePlan(true);
    }, 3000); // change 3000 to number of milliseconds you want (3s here)

    return () => clearTimeout(timer); // cleanup on unmount
  }, []);

  return (
    <div className='d-flex flex-column align-items-center justify-content-center gap-2'>
      {showChoosePlan ? (
        <ChoosePlan />
      ) : (
        <>
          <img src={animation_cart} alt="Loading animation" style={{width:"50%"}}/>
          <div>
            <h2 style={{ fontSize: "32px", fontFamily: "Inter, sans-serif", color: "white", textAlign: "center" }}>
              Please wait
            </h2>
            <p style={{ fontSize: "20px", fontFamily: "Inter, sans-serif", color: "white", textAlign: "center" }}>
              We are setting up your MUNC Inventory management account.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AnimationPage;
