import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./hooks/Web3hook";
import { UserWeb3Provider } from "./hooks/Web3UserHook";
import OrganisationRegisterPage from "./pages/CarbonCredit/Registerpage";
import OrganisationMarketplace from "./pages/CarbonCredit/MarketPlace";
import OrganisationClaimPage from "./pages/CarbonCredit/ClaimPage";
import Navbar from "./components/Navbar";
import RegisterPage from "./pages/RegisterPage";
import UserRegisterPage from "./pages/EcoCoin/Registerpage";
import UserClaimSubmissionPage from "./pages/EcoCoin/ClaimPage";
import RequestsPage from "./pages/CarbonCredit/RequestsPage";


function App() {
  return (
    <Router>
      <Web3Provider>
        <Navbar />
        <Routes>
          <Route path="organisation/register" element={<OrganisationRegisterPage />} />
          <Route path="organisation/marketplace" element={<OrganisationMarketplace />} />
          <Route path="organisation/claim" element={<OrganisationClaimPage />} />
          <Route path="organisation/requests" element={<RequestsPage />} />
        </Routes>
      </Web3Provider>
      <UserWeb3Provider>
        <Routes>
          <Route path="user/register" element={<UserRegisterPage />} />
          <Route path="user/claim" element={<UserClaimSubmissionPage />} />
        </Routes>
      </UserWeb3Provider>
      <Routes>
        <Route path="register" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
}

export default App;
