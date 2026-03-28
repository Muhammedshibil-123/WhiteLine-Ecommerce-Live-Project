import React from 'react';
import './about.css';
import { NavLink } from 'react-router-dom';

function About() {
  return (
    <div className="about-page">
      
   
      <div className="about-content">
        <div className="content-section">
          <h2>WHO WE ARE</h2>
          <p>
            Welcome to <strong>Whiteline</strong>. We aren't just a clothing brand; we are a movement. 
            Born from the streets and designed for the bold, Whiteline bridges the gap between 
            high-fashion aesthetics and everyday comfort.
          </p>
          <p>
            Our mission is simple: to empower you to express your unique identity through 
            premium quality fits. Whether you're into anime culture, sports vibes, or 
            minimalist streetwear, we create pieces that speak louder than words.
          </p>
        </div>

        <div className="values-grid">
          <div className="value-card">
            <h3>QUALITY FIRST</h3>
            <p>Premium fabrics that last. We don't compromise on the feel or durability of our gear.</p>
          </div>
          <div className="value-card">
            <h3>BOLD DESIGNS</h3>
            <p>From oversized tees to vintage washes, our designs are made to turn heads.</p>
          </div>
          <div className="value-card">
            <h3>COMMUNITY</h3>
            <p>We build for the culture. Whiteline is powered by the people who wear it.</p>
          </div>
        </div>

      
        <div className="contact-section">
          <h2>GET IN TOUCH</h2>
          <p className="contact-intro">Got questions? Need sizing help? Or just want to say what's up? We're here.</p>
          
          <div className="contact-details">
            <div className="contact-item">
              <h4>EMAIL US</h4>
              <p>support@whiteline.com</p>
              <p>collabs@whiteline.com</p>
            </div>
            <div className="contact-item">
              <h4>CALL US</h4>
              <p>+91 98765 43210</p>
              <p>Mon - Fri, 10am - 6pm</p>
            </div>
            <div className="contact-item">
              <h4>VISIT HQ</h4>
              <p>Whiteline Studios, Building 42</p>
              <p>Koramangala, Bangalore - 560034</p>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>JOIN THE REVOLUTION</h2>
          <p>Don't just wear the trend. Be the trend.</p>
          <NavLink to="/shop">
            <button className="shop-now-btn">EXPLORE COLLECTION</button>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default About;
