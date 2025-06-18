import React from 'react';
import TopLeftCard from './DashboardComponents/TopLeftCard';
import TopMiddleCard from './DashboardComponents/TopMiddleCard';
import MiddleLeftSmallCard from './DashboardComponents/MiddleLeftSmallCard';
import MiddleRightSmallCard from './DashboardComponents/MiddleRightSmallCard';
import TopRightCard from './DashboardComponents/TopRightCard';
import BottomLeftCard from './DashboardComponents/BottomLeftCard';
import BottomMiddleCard from './DashboardComponents/BottomMiddleCard';
import BottomRightCard from './DashboardComponents/BottomRightCard';

const OverviewTab = () => {
  return (
    <div className="min-h-screen bg-gray-50 px-6 pb-6 pt-0">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <p className="text-sm text-gray-500">Hello Dave, Welcome back</p>
          <h1 className="text-3xl font-bold text-gray-900">Your Dashboard is updated</h1>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Top Row */}
          {/* Top Left Card */}
          <div className="col-span-4">
            <TopLeftCard />
          </div>

          {/* Middle Column - Narrower */}
          <div className="col-span-4 space-y-4">
            {/* Top Middle Card */}
            <TopMiddleCard />

            {/* Small Cards Row */}
            <div className="grid grid-cols-2 gap-4">
              <MiddleLeftSmallCard />
              <MiddleRightSmallCard />
            </div>
          </div>

          {/* Top Right Card */}
          <div className="col-span-4">
            <TopRightCard />
          </div>

          {/* Bottom Section */}
          {/* Bottom Left Card */}
          <div className="col-span-4">
            <BottomLeftCard />
          </div>

          {/* Bottom Middle Card */}
          <div className="col-span-4">
            <BottomMiddleCard />
          </div>

          {/* Bottom Right Card */}
          <div className="col-span-4">
            <BottomRightCard />
          </div>

        </div>
      </div>
    </div>
  );
};

export default OverviewTab;