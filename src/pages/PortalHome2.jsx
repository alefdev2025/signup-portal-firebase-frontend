import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../contexts/MemberPortalProvider';
import alcorWhiteLogo from '../assets/images/alcor-white-logo.png';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../services/notifications';


export default PortalHome;