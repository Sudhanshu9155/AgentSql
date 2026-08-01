import React, { useState, useEffect } from 'react';
import { Database, Eye, MessageSquare, BarChart2, PieChart, BookOpen } from 'lucide-react';
import './Manual.css';

export default function Manual() {
  const [activeSection, setActiveSection] = useState('connect');

  useEffect(() => {
    const sections = [
      { id: 'connect' }, { id: 'schema' }, { id: 'chat' }, { id: 'analytics' }, { id: 'charts' }
    ];
    
    const handleScroll = () => {
      const scrollY = window.scrollY + 200; 
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'connect', title: 'Database Connection', icon: <Database size={16}/> },
    { id: 'schema', title: 'Show Schema', icon: <Eye size={16}/> },
    { id: 'chat', title: 'AI Chat Page', icon: <MessageSquare size={16}/> },
    { id: 'analytics', title: 'Analytics Overview', icon: <BarChart2 size={16}/> },
    { id: 'charts', title: 'Interactive Charts', icon: <PieChart size={16}/> },
  ];

  return (
    <div className="manual-page">
      {/* ADVANCED HERO SECTION */}
      <div className="manual-hero">
        <div className="hero-bg-glow"></div>
        <div className="hero-badge"><BookOpen size={14}/> Documentation</div>
        <h1>AgentSQL Platform Guide</h1>
        <p>A masterclass in navigating your AI database analytics workspace. Learn how to securely connect, effortlessly query, and brilliantly visualize your data.</p>
      </div>

      <div className="manual-layout">
        {/* STICKY SIDEBAR */}
        <aside className="manual-sidebar">
          <div className="sidebar-title">ON THIS PAGE</div>
          <nav className="manual-nav">
            {navItems.map(sec => (
              <a 
                key={sec.id} 
                href={`#${sec.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(sec.id).scrollIntoView({ behavior: 'smooth' });
                }}
                className={activeSection === sec.id ? 'active' : ''}
              >
                {sec.icon} {sec.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* CONTENT AREA */}
        <div className="manual-content">

          {/* SECTION 1 */}
          <section id="connect" className="advanced-section">
            <div className="section-header">
              <div className="step-number">01</div>
              <h2>Database Connection</h2>
            </div>
            <p className="section-desc">
              Securely link your MySQL databases using the <strong>Connections</strong> tab. AgentSQL uses AES-256-GCM encryption to ensure your credentials are never exposed. Hover over the pulsing dots to view detailed annotations.
            </p>
            
            <div className="showcase-box">
              <div className="showcase-bg-glow"></div>
              <div className="screenshot-container">
                <div className="mac-buttons"><span></span><span></span><span></span></div>
                <img src="/Database-connection.png" alt="Connect with Database" />
                
                <div className="prof-annotation dir-left" style={{ top: '35%', right: '5%' }}>
                  <div className="hotspot"></div>
                  <div className="prof-line"></div>
                  <div className="prof-card">
                    <div className="prof-card-title">Add Connection</div>
                    <div className="prof-card-text">Enter your Host, Port, User, and Password to establish a secure link to your database.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2 */}
          <section id="schema" className="advanced-section">
            <div className="section-header">
              <div className="step-number">02</div>
              <h2>Show Schema</h2>
            </div>
            <p className="section-desc">
              Inspect your database structure directly within the saved connections. Instantly view all tables, columns, and data types without writing a single query.
            </p>
            
            <div className="showcase-box">
              <div className="showcase-bg-glow" style={{ background: 'linear-gradient(135deg, rgba(255, 176, 32, 0.15), rgba(52, 87, 213, 0.15))'}}></div>
              <div className="screenshot-container">
                <div className="mac-buttons"><span></span><span></span><span></span></div>
                <img src="/Show-schema.png" alt="Show Schema" />
                
                <div className="prof-annotation dir-up" style={{ top: '45%', left: '50%', transform: 'translateX(-50%)' }}>
                  <div className="hotspot"></div>
                  <div className="prof-line"></div>
                  <div className="prof-card">
                    <div className="prof-card-title">View Schema Details</div>
                    <div className="prof-card-text">Click on any connection card to instantly expand its underlying schema tree.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3 */}
          <section id="chat" className="advanced-section">
            <div className="section-header">
              <div className="step-number">03</div>
              <h2>AI Chat Page</h2>
            </div>
            <p className="section-desc">
              The core of AgentSQL. Use the <strong>AI Chat</strong> to talk to your database in plain English. The AI automatically analyzes your schema and generates optimized SQL.
            </p>
            
            <div className="showcase-box">
              <div className="showcase-bg-glow"></div>
              <div className="screenshot-container">
                <div className="mac-buttons"><span></span><span></span><span></span></div>
                <img src="/chat-page.png" alt="AI Chat" />
                
                <div className="prof-annotation dir-down" style={{ bottom: '15%', left: '50%', transform: 'translateX(-50%)' }}>
                  <div className="hotspot"></div>
                  <div className="prof-line"></div>
                  <div className="prof-card">
                    <div className="prof-card-title">Natural Language Queries</div>
                    <div className="prof-card-text">Select your database at the top, then ask any question right here in plain English.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4 */}
          <section id="analytics" className="advanced-section">
            <div className="section-header">
              <div className="step-number">04</div>
              <h2>Analytics Overview</h2>
            </div>
            <p className="section-desc">
              Review the results of your queries and overall data health. This view provides a high-level summary of the raw data returned from your chat prompts.
            </p>
            
            <div className="showcase-box">
              <div className="showcase-bg-glow" style={{ background: 'linear-gradient(135deg, rgba(255, 176, 32, 0.15), rgba(52, 87, 213, 0.15))'}}></div>
              <div className="screenshot-container">
                <div className="mac-buttons"><span></span><span></span><span></span></div>
                <img src="/Analytic-page.png" alt="Analytics Page" />
                
                <div className="prof-annotation dir-up" style={{ top: '25%', left: '50%', transform: 'translateX(-50%)' }}>
                  <div className="hotspot"></div>
                  <div className="prof-line"></div>
                  <div className="prof-card">
                    <div className="prof-card-title">Data Insights</div>
                    <div className="prof-card-text">View your generated tables and AI explanations seamlessly alongside your query history.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5 */}
          <section id="charts" className="advanced-section">
            <div className="section-header">
              <div className="step-number">05</div>
              <h2>Interactive Charts</h2>
            </div>
            <p className="section-desc">
              Turn raw rows into actionable insights. AgentSQL automatically visualizes your query results with interactive, highly customizable charts.
            </p>
            
            <div className="showcase-box">
              <div className="showcase-bg-glow"></div>
              
              <div className="multi-screenshot-grid">
                <div className="screenshot-container">
                  <div className="mac-buttons"><span></span><span></span><span></span></div>
                  <img src="/Analytic-by-chart1.png" alt="Analytics Chart 1" />
                </div>
                
                <div className="screenshot-container">
                  <div className="mac-buttons"><span></span><span></span><span></span></div>
                  <img src="/Analytic-by-chart2.png" alt="Analytics Chart 2" />
                  
                  <div className="prof-annotation dir-left" style={{ top: '50%', right: '5%' }}>
                    <div className="hotspot"></div>
                    <div className="prof-line"></div>
                    <div className="prof-card">
                      <div className="prof-card-title">Visual Customization</div>
                      <div className="prof-card-text">Switch between Pie, Bar, or Line charts with a single click to present data perfectly.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
