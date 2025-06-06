// File: pages/components/BasicMembershipCards.jsx
import React from "react";
import BasicMembershipCardsMobile from "./BasicMembershipCardsMobile";
import BasicMembershipCardsDesktop from "./BasicMembershipCardsDesktop";

const BasicMembershipCards = ({ packageInfo, animationComplete, content }) => {
  // Ensure content exists with default structure
  if (!content || !content.cards) {
    console.error("BasicMembershipCards: Missing content prop");
    return null;
  }

  return (
    <>
      {/* Mobile Version - Dark themed */}
      <BasicMembershipCardsMobile 
        packageInfo={packageInfo}
        animationComplete={animationComplete}
        content={content}
      />
      
      {/* Desktop Version - White themed with colored icons */}
      <BasicMembershipCardsDesktop 
        packageInfo={packageInfo}
        animationComplete={animationComplete}
        content={content}
      />
    </>
  );
};

export default BasicMembershipCards;