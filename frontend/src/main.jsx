import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { WalletProvider } from './contexts/WalletContext';
import { CurrencyProvider } from './utils/currency.jsx';
import Home from './pages/Home';
// import Discover from './pages/Discover';
import Testimonials from './pages/Testimonials';
import Hero from './pages/Hero';
import EventList from './pages/EventList';
import EventDetails from './pages/EventDetails';
import Qrcode from './pages/Qrcode';
import Chatbit from './pages/Chatbit';
import Footer from './components/Footer';
// import Ticketsell from './pages/Ticketsell';
import MintNFT from './pages/MintNFT';
import Ticket from './pages/Ticket';
import Teams from './pages/Teams';
import Layout from './Layout';
import Myevent from './pages/Myevent';
import Profile from './pages/Profile';
import EventDashboard from './pages/EventDashboard';
import './index.css';
import WaitlistPage from './pages/WaitingList';
import QuantumTicketResale from './pages/QuantamTicketResale';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><Home /></Layout>,
  },
  // {
  //   path: "discover",
  //   element: <Layout><Discover /></Layout>,
  // },
  {
    path: "testimonials",
    element: <Layout><Testimonials /></Layout>,
  },
  {
    path: "qrcode",
    element: <Layout><Qrcode /></Layout>,
  },
  {
    path: "ticket",
    element: <Layout><Ticket /></Layout>,
  },
  {
    path: "teams",
    element: <Layout><Teams /></Layout>,
  },

  {
    path: "hero",
    element: <Layout><Hero /></Layout>,
  },
  {
    path: "event",
    element: <Layout><EventList /></Layout>,
  },
  {
    path: "mint",
    element: <Layout><MintNFT /></Layout>,
  },
  
  {
    path: "event-details",
    element: <Layout><EventDetails /></Layout>,
  },
  {
    path: "Myevent",
    element: <Layout><Myevent /></Layout>,
  },
  {
    path: "chatbit",
    element: <Chatbit />,
  },

  {
    path: "waiting",
    element: <Layout><WaitlistPage /></Layout>
  },

  {
    path: "resell",
    element: <Layout><QuantumTicketResale /></Layout>
  },

  {
    path: "profile",
    element: <Layout><Profile /></Layout>
  },

  {
    path: "event-dashboard/:eventId",
    element: <Layout><EventDashboard /></Layout>
  },

  {
    path: "*",
    element: <Footer />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider value={defaultSystem}>
      <WalletProvider>
        <CurrencyProvider>
          <RouterProvider router={router} />
        </CurrencyProvider>
      </WalletProvider>
    </ChakraProvider>
  </React.StrictMode>
);