# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# Payment Implementation - Cache Update Guide

## Overview
The member portal uses a caching system to improve performance by preloading data when users log in. When implementing payment functionality, you need to ensure the cache is properly updated after any data changes.

## Architecture Overview

### Data Flow
1. **CustomerDataContext** (`/src/components/portal/contexts/CustomerDataContext.jsx`) - Manages all customer data
2. **paymentDataService** (`/src/components/portal/services/paymentDataService.jsx`) - Handles payment-specific caching
3. **MemberPortalProvider** (`/src/contexts/MemberPortalProvider.jsx`) - Wraps portal components and triggers initial data loading

### Cache Duration
- Default cache duration: 30 minutes
- Data automatically refreshes in background if stale when accessed

## When to Update Cache

### 1. After Making a Payment

```javascript
// In your payment success handler
import { useCustomerData } from './contexts/CustomerDataContext';

const PaymentForm = () => {
  const { fetchPaymentsWithDetails, fetchInvoices } = useCustomerData();
  
  const handlePaymentSuccess = async (paymentResult) => {
    try {
      // Your payment API call
      const result = await submitPayment(paymentData);
      
      // Update cache - refresh both payments and invoices
      await Promise.all([
        fetchPaymentsWithDetails({ forceRefresh: true }),
        fetchInvoices({ forceRefresh: true })
      ]);
      
      // Navigate or show success message
      navigate('/portal/payments-history');
    } catch (error) {
      // Handle error
    }
  };
};
```

### 2. After Paying an Invoice

```javascript
// In your invoice payment handler
const handleInvoicePayment = async (invoiceId) => {
  try {
    // Your invoice payment API call
    await payInvoice(invoiceId);
    
    // Refresh both invoices and payments
    await Promise.all([
      fetchInvoices({ forceRefresh: true }),
      fetchPaymentsWithDetails({ forceRefresh: true })
    ]);
    
    // Update UI
  } catch (error) {
    // Handle error
  }
};
```

### 3. After Updating Payment Method

```javascript
// In your payment method update handler
const handlePaymentMethodUpdate = async (newPaymentMethod) => {
  try {
    await updatePaymentMethod(newPaymentMethod);
    
    // Only need to refresh payment methods in this case
    await fetchPaymentMethods({ forceRefresh: true });
  } catch (error) {
    // Handle error
  }
};
```

### 4. For External Payment Systems (e.g., Stripe webhook)

```javascript
// In your webhook handler or payment confirmation page
const PaymentConfirmationPage = () => {
  const { fetchPaymentsWithDetails, fetchInvoices } = useCustomerData();
  
  useEffect(() => {
    // When returning from external payment
    const confirmPayment = async () => {
      const paymentStatus = await checkPaymentStatus(sessionId);
      
      if (paymentStatus.success) {
        // Force refresh all payment-related data
        await Promise.all([
          fetchPaymentsWithDetails({ forceRefresh: true }),
          fetchInvoices({ forceRefresh: true })
        ]);
      }
    };
    
    confirmPayment();
  }, [sessionId]);
};
```

## Available Cache Update Methods

### From CustomerDataContext hooks:
```javascript
const { 
  fetchPaymentsWithDetails,  // Refresh payments with invoice details
  fetchInvoices,            // Refresh invoices
  fetchPaymentSummary,      // Refresh payment statistics
  refreshAllData            // Refresh everything
} = useCustomerData();
```

### Options for fetch methods:
```javascript
// Force refresh (bypass cache)
await fetchPaymentsWithDetails({ forceRefresh: true });

// Silent refresh (no loading state shown)
await fetchPaymentsWithDetails({ forceRefresh: true, silent: true });
```

## Important Relationships

When implementing payments, remember these data relationships:

1. **Payment → Invoices**: A payment is usually applied to one or more invoices
   - After payment: Refresh both payments AND invoices

2. **Invoice → Payments**: Paying an invoice creates a payment record
   - After invoice payment: Refresh both invoices AND payments

3. **Payment Methods**: Independent of payments/invoices
   - Only refresh when payment methods are added/removed/updated

## Best Practices

1. **Always use `forceRefresh: true`** after data modifications
   ```javascript
   await fetchPaymentsWithDetails({ forceRefresh: true });
   ```

2. **Update related data together** using Promise.all
   ```javascript
   await Promise.all([
     fetchPaymentsWithDetails({ forceRefresh: true }),
     fetchInvoices({ forceRefresh: true })
   ]);
   ```

3. **Handle loading states** - The context provides loading states
   ```javascript
   const { isLoading } = usePayments();
   if (isLoading) {
     // Show loading spinner
   }
   ```

4. **Don't over-refresh** - Only refresh data that's actually affected
   - Payment made → Refresh payments & invoices
   - Profile updated → Use `refreshAllData()`
   - Viewing data → Let automatic stale detection handle it

## Testing Cache Updates

1. Make a payment in your implementation
2. Navigate away from the payment history tab
3. Navigate back - you should see the new payment immediately
4. Check that related invoices also show as paid

## Common Issues

### Issue: New payment not showing
**Solution**: Ensure you're calling `fetchPaymentsWithDetails({ forceRefresh: true })` after payment success

### Issue: Invoice still shows as unpaid after payment
**Solution**: Make sure to refresh both payments AND invoices after payment

### Issue: Loading states not working
**Solution**: Use the `isLoading` state from the hooks, not local state

## Future Enhancements

Consider implementing:
1. WebSocket connections for real-time updates
2. Optimistic updates (show payment immediately, rollback if fails)
3. Partial cache updates (update specific records instead of full refresh)

# Cache System Deep Dive - Don't Be Dumb Future Self!

## How The Whole Thing Actually Works (The Mental Model)

### The Wrapper Hierarchy
```
App.jsx
  └── UserProvider (handles auth)
      └── MemberPortalRoute (only for portal routes)
          └── MemberPortalProvider 
              └── CustomerDataProvider (THIS IS WHERE THE MAGIC HAPPENS)
                  └── Your actual portal components
```

**Why this matters**: If you try to use `usePayments()` or any data hooks OUTSIDE of these wrappers, you'll get errors like "useCustomerData must be used within CustomerDataProvider".

### The Data Flow Timeline

1. **User logs in** → UserProvider sets `currentUser` with `customerId`
2. **User navigates to portal** → MemberPortalProvider kicks in
3. **MemberPortalProvider sees customerId** → Wraps everything with CustomerDataProvider
4. **CustomerDataProvider mounts** → Immediately starts fetching ALL data in parallel
5. **User clicks Payment History tab** → Data is already there! (or loading)

## Critical Gotchas That Will Bite You

### Gotcha #1: The Import Paths Are Confusing AF
```javascript
// From most components:
import { usePayments } from './contexts/CustomerDataContext';

// But the actual file is at:
// /src/components/portal/contexts/CustomerDataContext.jsx

// So depending on where you are, it might be:
import { usePayments } from '../../contexts/CustomerDataContext';
// OR
import { usePayments } from '../../../components/portal/contexts/CustomerDataContext';
```

**Fix**: Use your IDE's auto-import or set up path aliases in vite.config.js

### Gotcha #2: The PaymentDataService is a Singleton
```javascript
// This is a CLASS INSTANCE, not a React component
export const paymentDataService = new PaymentDataService();

// So you CAN'T do this:
const { paymentDataService } = useContext(SomeContext); // ❌ WRONG

// You MUST import it directly:
import { paymentDataService } from './services/paymentDataService'; // ✅ RIGHT
```

### Gotcha #3: Silent vs Non-Silent Refreshes
```javascript
// This shows loading spinners:
await fetchPaymentsWithDetails({ forceRefresh: true });

// This updates in background WITHOUT showing loading:
await fetchPaymentsWithDetails({ forceRefresh: true, silent: true });
```

**When to use silent**: 
- Background refreshes after user returns to a tab
- After a payment when you want to show a success message instead of a loader

### Gotcha #4: The Double-Fetch Pattern
Look at this code in CustomerDataContext:
```javascript
if (result.fromCache) {
  console.log('Loaded from cache, checking for updates...');
  paymentDataService.getPayments(customerId, { forceRefresh: true, silent: true });
}
```

**What's happening**: 
1. First fetch returns cached data immediately
2. THEN it fetches fresh data in the background
3. When fresh data arrives, components auto-update

**Why this matters**: Users see data instantly, but it might be stale for a few seconds

### Gotcha #5: CustomerID Confusion
```javascript
// In some places it comes from props:
const InvoicesTab = ({ customerId = '4666' }) => {

// In other places from context:
const { customerId } = useMemberPortal();

// In services, you pass it explicitly:
await getCustomerPayments(customerId, options);
```

**The truth**: CustomerID flows like this:
1. UserContext has the real customerId after login
2. MemberPortalProvider reads it from UserContext
3. CustomerDataProvider gets it from MemberPortalProvider
4. Components get it as props from PortalHome

### Gotcha #6: The 30-Minute Cache Duration
```javascript
// In paymentDataService.js:
this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
```

**What this means**:
- Data older than 30 minutes is considered "stale"
- Stale data still shows immediately
- But triggers a background refresh
- User might see old data briefly, then it updates

## How Each Piece Actually Works

### CustomerDataContext
This is the brain. It:
1. Creates a React context
2. Manages ALL data state (payments, invoices, etc.)
3. Provides hooks like `usePayments()`, `useInvoices()`
4. Handles loading states and errors
5. Coordinates with the singleton services

### PaymentDataService (The Singleton)
This is a caching layer that:
1. Stores payment data in memory
2. Tracks when data was last fetched
3. Decides if cache is valid
4. Manages subscriptions (observer pattern)
5. Enriches payments with invoice details

**Key insight**: This exists OUTSIDE React's component tree, so data persists even if components unmount/remount.

### MemberPortalProvider
This is the orchestrator that:
1. Gets customerId from UserContext
2. Wraps everything with CustomerDataProvider
3. Triggers initial data preload
4. Handles preload errors gracefully

## The Subscription Pattern Explained

```javascript
// In PaymentHistoryTab (the old way that caused errors):
useEffect(() => {
  let unsubscribe;
  
  // Subscribe to payment data updates
  unsubscribe = paymentDataService.subscribe((state) => {
    if (state.payments) {
      const processedPayments = processPayments(state.payments);
      setPayments(processedPayments);
    }
  });
  
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, []);
```

**Why we removed this**: The CustomerDataContext already handles subscriptions. Using both causes conflicts.

## State Management Layers

You have THREE layers of state:

1. **Singleton Service State** (paymentDataService)
   - Lives outside React
   - Persists between component mounts
   - Has its own cache logic

2. **Context State** (CustomerDataContext)
   - React-based state
   - Provides hooks
   - Coordinates with singleton

3. **Component State** (local useState)
   - For UI-specific state
   - Like selected filters, expanded rows, etc.

## When Things Go Wrong - Debugging Guide

### Debug Step 1: Check the Console
Look for these key logs:
```
[MemberPortal] Starting data preload for customer: 4527
Fetching payments from NetSuite...
Payments fetched in 5900ms
[MemberPortal] Data preload completed
```

### Debug Step 2: Check Component Mounting
Add this to any component:
```javascript
useEffect(() => {
  console.log('Component mounted, customerId:', customerId);
  return () => console.log('Component unmounted');
}, []);
```

### Debug Step 3: Check Context Availability
```javascript
try {
  const data = usePayments();
  console.log('Context works!', data);
} catch (e) {
  console.log('Context not available:', e.message);
}
```

### Debug Step 4: Check Network Tab
- Look for duplicate API calls (means cache isn't working)
- Check response times (if > 10s, that's why it's slow)
- Verify the correct customerId in requests

## Future Self Reminders

1. **Don't try to optimize prematurely** - The double-fetch pattern is intentional
2. **Don't bypass the context** - Always use the hooks, not direct service access
3. **Don't forget Promise.all** - When refreshing related data
4. **Don't ignore TypeScript errors** - They're usually about missing providers
5. **Don't put data fetching in PortalHome** - Let the context handle it

## Architecture Decisions Explained

**Q: Why singleton + context instead of just context?**
A: Singleton persists data between route changes. Context would reset.

**Q: Why preload on portal mount instead of login?**
A: Users might not visit portal immediately after login. Don't waste bandwidth.

**Q: Why 30-minute cache instead of session-based?**
A: Balance between freshness and performance. Adjustable if needed.

**Q: Why fetch invoice details for each payment?**
A: NetSuite's payment API doesn't include full invoice info. Trade-off for better UX.

## Testing Checklist for Payment Implementation

- [ ] Payment shows in history immediately after success
- [ ] Related invoice shows as "Paid"
- [ ] Refresh button works without duplicating entries
- [ ] Navigate away and back - data still there
- [ ] Wait 31 minutes - see background refresh happen
- [ ] Error handling - what if refresh fails?
- [ ] Multiple tabs open - do they sync?

## Code Snippets for Common Tasks

### Adding a New Data Type
```javascript
// 1. Add to CustomerDataContext state
const [data, setData] = useState({
  payments: null,
  invoices: null,
  newDataType: null, // ADD THIS
  // ...
});

// 2. Create fetch function
const fetchNewDataType = useCallback(async (options = {}) => {
  return fetchData('newDataType', async () => {
    return await getNewDataType(customerId);
  }, options);
}, [customerId, fetchData]);

// 3. Create hook
export const useNewDataType = () => {
  const { getData } = useCustomerData();
  return getData('newDataType');
};

// 4. Add to preload
useEffect(() => {
  Promise.all([
    fetchPaymentsWithDetails(),
    fetchInvoices(),
    fetchNewDataType() // ADD THIS
  ]);
}, [customerId]);
```

### Force Refresh from Anywhere
```javascript
// Option 1: From a component
const { refreshAllData } = useCustomerData();
await refreshAllData();

// Option 2: From outside React (use with caution)
import { paymentDataService } from './services/paymentDataService';
paymentDataService.clearCache();
```

### Add Loading State to Any Component
```javascript
const MyComponent = () => {
  const { data, isLoading, error } = usePayments();
  
  if (isLoading && !data) return <Skeleton />;
  if (error && !data) return <Error />;
  
  // Show data even if refreshing in background
  return <PaymentList payments={data.payments} />;
};
```

Remember: The cache system is your friend. Trust it, but verify with testing!


Gradient colors:

d9b852
cd9d55
c2876a
ae7968
996b66
9f6d68
b38490
9e6880
83617e
7c5d86
724e82
724e82
4b3865
3b345b
272b4d
12233b

import React from 'react';

// The gradient colors and stops
export const gradientColors = [
  { color: '#12233b', stop: 0 },
  { color: '#272b4d', stop: 10 },
  { color: '#3b345b', stop: 20 },
  { color: '#4b3865', stop: 30 },
  { color: '#5d4480', stop: 40 },
  { color: '#6c5578', stop: 50 },
  { color: '#7b5670', stop: 60 },
  { color: '#8a5f64', stop: 70 },
  { color: '#996b66', stop: 80 },
  { color: '#ae7968', stop: 85 },
  { color: '#c2876a', stop: 88 },
  { color: '#d4a85f', stop: 91 },
  { color: '#ddb571', stop: 92.5 },
  { color: '#e4c084', stop: 94 },
  { color: '#e9ca96', stop: 95.5 },
  { color: '#efd3a8', stop: 97 },
  { color: '#f7ddb5', stop: 98.5 },
  { color: '#ffd4a3', stop: 100 }
];

// Generate gradient string
const generateGradient = (angle = 135, colors = gradientColors) => {
  const colorStops = colors.map(({ color, stop }) => `${color} ${stop}%`).join(', ');
  return `linear-gradient(${angle}deg, ${colorStops})`;
};

// Default gradient style object
export const gradientStyle = {
  background: generateGradient()
};

// GradientBackground Component
const GradientBackground = ({ 
  children, 
  className = '', 
  angle = 135,
  customColors = null,
  style = {},
  as: Component = 'div',
  ...props 
}) => {
  const gradient = customColors ? generateGradient(angle, customColors) : generateGradient(angle);
  
  return (
    <Component 
      className={className}
      style={{ 
        background: gradient,
        ...style 
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

// Hook to use the gradient in other components
export const useGradientBackground = (angle = 135, customColors = null) => {
  return {
    background: customColors ? generateGradient(angle, customColors) : generateGradient(angle)
  };
};

// Usage examples
export const GradientExamples = () => {
  return (
    <div className="space-y-4 p-8">
      {/* Basic usage */}
      <GradientBackground className="p-6 rounded-lg text-white">
        <h3 className="text-xl font-bold">Basic Gradient Background</h3>
        <p>This uses the default gradient</p>
      </GradientBackground>

      {/* With custom angle */}
      <GradientBackground angle={90} className="p-6 rounded-lg text-white">
        <h3 className="text-xl font-bold">Horizontal Gradient</h3>
        <p>This uses a 90-degree angle</p>
      </GradientBackground>

      {/* As a button */}
      <GradientBackground as="button" className="px-6 py-3 rounded-full text-white font-medium">
        Gradient Button
      </GradientBackground>

      {/* Using the style object directly */}
      <div style={gradientStyle} className="p-6 rounded-lg text-white">
        <h3 className="text-xl font-bold">Using gradientStyle object</h3>
        <p>Import and apply the style object directly</p>
      </div>

      {/* Using the hook */}
      <div style={useGradientBackground(45)} className="p-6 rounded-lg text-white">
        <h3 className="text-xl font-bold">Using useGradientBackground hook</h3>
        <p>45-degree angle gradient</p>
      </div>
    </div>
  );
};

export default GradientBackground;

0e0e2f
1b163a
2a1b3d
3f2541
5b2f4b
74384d
914451
a04c56
a25357
b66e5d
cb8863
d79564



FOR PRODUCTION FOR FORMS

Make sure to add forms to Firebase 

go to storage in the firebase backend

/documents/forms 

add all the forms in the Alcor Forms For Member Portal folde


URLS FOR PRODUCTION


// src/components/portal/services/salesforce/memberDocuments.js
const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app' || 'http://localhost:8080';

Some places we have hardcoded like this instead of being env specific



825f7c
404060
13283f