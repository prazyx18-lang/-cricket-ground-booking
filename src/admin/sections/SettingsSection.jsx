import { useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { useStored } from '../../hooks/useStored.js';
import { DEFAULT_CONFIG, KEYS, resetDemoData } from '../../lib/storage.js';
import { updatePrices } from '../../lib/bookingLogic.js';

export default function SettingsSection() {
  const config = useStored(KEYS.config, DEFAULT_CONFIG);
  const toast = useToast();
  const [prices, setPrices] = useState({
    teamPrice: String(config.teamPrice),
    entireGroundPrice: String(config.entireGroundPrice),
  });
  const [resetText, setResetText] = useState('');
  const [resetting, setResetting] = useState(false);

  const savePrices = (e) => {
    e.preventDefault();
    try {
      updatePrices(prices);
      toast.success('Prices updated. New bookings use the new amounts.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const doReset = () => {
    if (resetText !== 'RESET' || resetting) return;
    setResetting(true);
    window.setTimeout(() => {
      resetDemoData();
      setResetText('');
      setResetting(false);
      toast.success('Demo data reset. Sample bookings and slots restored.');
    }, 300);
  };

  return (
    <div className="settings-grid">
      <section className="card admin-panel">
        <h2>Pricing (demo)</h2>
        <p className="muted small">Amounts are used for demo revenue only. No payments are taken.</p>
        <form className="stacked-form" onSubmit={savePrices} noValidate>
          <label>
            <span>Team slot price (₹)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={prices.teamPrice}
              onChange={(e) => setPrices({ ...prices, teamPrice: e.target.value })}
            />
          </label>
          <label>
            <span>Entire ground price (₹)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={prices.entireGroundPrice}
              onChange={(e) => setPrices({ ...prices, entireGroundPrice: e.target.value })}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Save prices
          </button>
        </form>
      </section>

      <section className="card admin-panel danger-zone">
        <h2>Reset demo data</h2>
        <p className="muted small">
          This erases all bookings, slots, blocks, customers and settings in this browser, then restores the sample
          data. It cannot be undone.
        </p>
        <label className="stacked-form">
          <span>
            Type <strong>RESET</strong> to confirm
          </span>
          <input value={resetText} onChange={(e) => setResetText(e.target.value)} placeholder="RESET" />
        </label>
        <button
          type="button"
          className="btn btn-danger"
          disabled={resetText !== 'RESET' || resetting}
          onClick={doReset}
        >
          {resetting && <span className="spinner" aria-hidden="true" />}
          Reset demo data
        </button>
      </section>
    </div>
  );
}
