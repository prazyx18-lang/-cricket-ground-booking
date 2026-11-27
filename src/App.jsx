import { Route, Routes } from 'react-router-dom';
import CustomerLayout from './components/CustomerLayout.jsx';
import Home from './pages/Home.jsx';
import GroundDetails from './pages/GroundDetails.jsx';
import BookSlot from './pages/BookSlot.jsx';
import MyBookings from './pages/MyBookings.jsx';
import Confirmation from './pages/Confirmation.jsx';
import AdminPage from './admin/AdminPage.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="ground" element={<GroundDetails />} />
        <Route path="book" element={<BookSlot />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="confirmation/:bookingId" element={<Confirmation />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin" element={<AdminPage />} />
    </Routes>
  );
}
