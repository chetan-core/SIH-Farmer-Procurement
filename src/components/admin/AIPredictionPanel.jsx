import { useState, useEffect } from "react";
import { AlertTriangle, BrainCircuit, Activity, CloudRain, Package, CheckCircle2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function AIPredictionPanel() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPrediction() {
      try {
        const response = await fetch(`${API_URL}/admin/predictions/shortages?district_id=hyd`);
        const data = await response.json();
        
        if (data.success) {
          setPrediction(data.data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError("Failed to reach AI service.");
      } finally {
        setLoading(false);
      }
    }
    fetchPrediction();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard-section" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <BrainCircuit className="admin-refresh-spin" size={24} color="#3b82f6" />
        <span style={{ color: '#64748b' }}>AI is analyzing district data and forecasting shortages (15-day outlook)...</span>
      </div>
    );
  }

  if (error) {
    return null; // Fail silently or show error
  }

  if (!prediction) return null;

  const isHighRisk = prediction.shortageRisk === "HIGH";

  return (
    <div style={{
      background: isHighRisk ? '#fff1f2' : '#f0fdf4',
      border: `1px solid ${isHighRisk ? '#fecdd3' : '#bbf7d0'}`,
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '32px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <BrainCircuit size={28} color={isHighRisk ? '#e11d48' : '#16a34a'} />
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: isHighRisk ? '#9f1239' : '#166534', fontWeight: 'bold' }}>
          AI Shortage Forecast (15 Days)
        </h3>
        <span style={{
          marginLeft: 'auto',
          background: isHighRisk ? '#e11d48' : '#16a34a',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>
          {prediction.shortageRisk} RISK
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div>
          <h4 style={{ color: isHighRisk ? '#be123c' : '#15803d', marginBottom: '8px', fontSize: '1rem' }}>Analysis & Reasoning</h4>
          <p style={{ color: '#334155', lineHeight: '1.6', margin: 0 }}>
            {prediction.reasoning}
          </p>
        </div>
        
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ color: '#475569', marginBottom: '12px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Key Metrics
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <Package size={16} /> Predicted Deficit
              </span>
              <strong style={{ color: isHighRisk ? '#e11d48' : '#0f172a' }}>{prediction.predictedDeficitTonnes} Tonnes</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <CloudRain size={16} /> Weather Factor
              </span>
              <strong style={{ color: '#0f172a' }}>Adverse</strong>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 style={{ color: isHighRisk ? '#be123c' : '#15803d', marginBottom: '12px', fontSize: '1rem' }}>
          Recommended Corrective Actions
        </h4>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {prediction.correctiveActions.map((action, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#334155' }}>
              <CheckCircle2 size={20} color={isHighRisk ? '#e11d48' : '#16a34a'} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
