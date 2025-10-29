import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Prepare from "./Prepare";

import Practice from "./Practice";

import Perform from "./Perform";

import Landing from "./Landing";

import Billing from "./Billing";

import Home from "./Home";

import Profile from "./Profile";

import Referral from "./Referral";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Prepare: Prepare,
    
    Practice: Practice,
    
    Perform: Perform,
    
    Landing: Landing,
    
    Billing: Billing,
    
    Home: Home,
    
    Profile: Profile,
    
    Referral: Referral,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Prepare" element={<Prepare />} />
                
                <Route path="/Practice" element={<Practice />} />
                
                <Route path="/Perform" element={<Perform />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Billing" element={<Billing />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Referral" element={<Referral />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}