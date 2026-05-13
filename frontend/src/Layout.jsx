import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
// import WalletStatus from './components/WalletStatus';

const Layout = ({ children }) => (
  <>
    <Header />
    <main style={{ minHeight: '80vh' }}>{children}</main>
    <Footer />
    {/* <WalletStatus /> */}
  </>
);

export default Layout;
