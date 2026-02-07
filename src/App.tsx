import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Hero from "./pages/Hero";
import Discover from "./pages/Discover";
import EventList from "./pages/EventList";
import EventDetails from "./pages/EventDetails";
import TicketPurchase from "./components/TicketPurchase";
import Testimonials from "./pages/Testimonials";
import Chatbit from "./pages/Chatbit";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Qrcode from "./pages/Qrcode";
import QRScanner from "./pages/QRScanner";
import ConnectWalletButton from "./components/ConnectWallet";
import CreateEvent from "./pages/CreateEvent";
import Ticket from "./pages/Ticket";
import MyEvent from "./pages/Myevent";
import Teams from "./pages/Teams";
import MintNFT from "./pages/MintNFT";
import WaitlistPage from "./pages/WaitingList";
import QuantumTicketResale from "./pages/QuantamTicketResale";

const App = () => {
  return (
    <Router>
      {/* Header Component - Displayed on all pages */}
      <Header />
      {/* Chatbit Component - Displayed on all pages */}
      <Chatbit />

      {/* Routing Order */}
      <Routes>
        {/* Hero as Default Page */}
        <Route path="/" element={<Hero />} />

        {/* Testimonials under Hero */}
        <Route path="/testimonials" element={<Testimonials />} />
        
        {/* Qrcode under Testimonials */}
        <Route path="/qrcode" element={<Qrcode />} />
        
        {/* QR Scanner for verification */}
        <Route path="/scanner" element={<QRScanner />} />

        {/* Discover under Testimonials */}
        <Route path="/discover" element={<Discover />} />

        {/* Buy under Testimonials */}
        <Route path="/ticket" element={<Ticket />} />

        {/* Home, EventList, EventDetails remain unchanged */}
        <Route path="/home" element={<Home />} />
        <Route path="/events" element={<EventList />} />
        {/* <Route path="/event/:eventId" element={<EventDetails />} /> */}
        
        {/* Teams under Testimonials */}
        <Route path="/teams" element={<Teams />} />

        {/* Additional Pages */}
        <Route path="/purchase" element={<TicketPurchase />} />
        <Route path="/connect wallet" element={<ConnectWalletButton />} />
        <Route path="/footer" element={<Footer />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/mint" element={<MintNFT />} />
        <Route path="/waiting" element={<WaitlistPage />} />
        <Route path="/resell" element={<QuantumTicketResale />} />
        <Route path="/Myevent" element={<MyEvent />} />
      </Routes>

      {/* Footer Component - Displayed on all pages */}
      <Footer />
    </Router>
  );
};

export default App;