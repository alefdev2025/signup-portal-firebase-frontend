import React from 'react';
import SignupPage from "./pages/SignupPage";
import { UserProvider } from "./contexts/UserContext";

function App() {
  return (
    <UserProvider>
      <SignupPage />
    </UserProvider>
  );
}

export default App;