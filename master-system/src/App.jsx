import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Clients from './pages/Clients';
import Quotes from './pages/Quotes';
import QuoteBuilder from './pages/QuoteBuilder';
import Invoices from './pages/Invoices';
import Financials from './pages/Financials';
import Profitability from './pages/Profitability';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/quote-builder" element={<QuoteBuilder />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/profitability" element={<Profitability />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}