// File: components/signup/LifetimeMembershipSection.jsx
import React from "react";
import alcorStar from "../../assets/images/alcor-yellow-star.png";

export default function LifetimeMembershipSection({ 
  interestedInLifetime, 
  setInterestedInLifetime 
}) {
  return (
    <div className="mb-8 bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff] border border-gray-200 rounded-xl p-10 shadow-sm">
      <div className="flex items-start">
        <input
          type="checkbox"
          id="lifetime-membership-interest"
          checked={interestedInLifetime}
          onChange={(e) => setInterestedInLifetime(e.target.checked)}
          className="mt-0.5 h-8 w-8 text-[#775684] focus:ring-[#775684] border-[#775684] rounded cursor-pointer accent-[#775684]"
        />
        <label 
          htmlFor="lifetime-membership-interest" 
          className="ml-5 cursor-pointer"
        >
          <span className="text-3xl text-gray-800 font-bold flex items-center">
            I'm interested in Lifetime Membership
            <img src={alcorStar} alt="Alcor Star" className="w-8 h-8 ml-3" />
          </span>
          <p className="text-gray-600 mt-3 text-xl">
            Pay once and never worry about membership dues again. We'll contact you with a personalized quote based on your age.
          </p>
          <p className="text-[#775684] mt-4 text-xl font-medium">
            ✓ No future price increases &nbsp;&nbsp;• &nbsp;&nbsp;✓ One-time payment &nbsp;&nbsp;• &nbsp;&nbsp;✓ Peace of mind
          </p>
          <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <p className="text-gray-700 text-xl">
              <strong className="text-xl">Note:</strong> If you select lifetime membership, you'll submit only a membership application today and won't start your membership. We'll contact you within 24-48 hours to finalize your lifetime membership arrangement.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}