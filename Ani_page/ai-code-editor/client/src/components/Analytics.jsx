// Analytics Dashboard 
import React, { useState, useEffect } from 'react'; 
export default function Analytics() { 
  const [stats, setStats] = useState({ 
    totalLines: 0, aiRequests: 0, languages: [], activeTime: 0 
  }); 
  return <div className="analytics-dashboard"> 
    <h3>📊 Coding Analytics</h3> 
    <div className="stats-grid">{/* Analytics UI */}</div> 
  </div>; 
} 

