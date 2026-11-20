import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store/store';
import Layout from './components/Layout';
import { Login, SecurityCode, Locked, Signup } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Storefront from './pages/Storefront';
import { EquipmentList, EquipmentDetail, EquipmentWizard } from './pages/Equipment';
import PricingPage from './pages/Pricing';
import CalendarPage from './pages/Calendar';
import { QuoteList, QuoteDetail } from './pages/Quotes';
import { BookingList, BookingDetail } from './pages/Bookings';
import { DeliveryList, DeliveryDetail } from './pages/Deliveries';
import Compliance from './pages/Compliance';
import Reviews from './pages/Reviews';
import { SupportList, SupportDetail } from './pages/Support';
import Earnings from './pages/Earnings';
import Team from './pages/Team';
import Settings from './pages/Settings';
import { Empty } from './components/ui';

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/login/code" element={<SecurityCode />} />
          <Route path="/login/locked" element={<Locked />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="storefront" element={<Storefront />} />
            <Route path="equipment" element={<EquipmentList />} />
            <Route path="equipment/new" element={<EquipmentWizard />} />
            <Route path="equipment/:id" element={<EquipmentDetail />} />
            <Route path="equipment/:id/edit" element={<EquipmentWizard />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="quotes" element={<QuoteList />} />
            <Route path="quotes/:id" element={<QuoteDetail />} />
            <Route path="bookings" element={<BookingList />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
            <Route path="deliveries" element={<DeliveryList />} />
            <Route path="deliveries/:id" element={<DeliveryDetail />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="support" element={<SupportList />} />
            <Route path="support/:id" element={<SupportDetail />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Empty title="Page not found" text="This page does not exist." action={<Link className="btn btn-primary" to="/">Go to the dashboard</Link>} />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
