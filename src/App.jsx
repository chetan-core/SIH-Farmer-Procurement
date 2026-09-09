import {
  Routes,
  Route,
} from "react-router";

import Landing from "./pages/Landing";

import FarmerLogin from "./pages/farmer/FarmerLogin";
import FarmerRegister from "./pages/farmer/FarmerRegister";
import FarmerHome from "./pages/farmer/FarmerHome";
import FarmerBook from "./pages/farmer/FarmerBook";
import FarmerToken from "./pages/farmer/FarmerToken";
import FarmerTransport from "./pages/farmer/FarmerTransport";
import FarmerLogistics from "./pages/farmer/FarmerLogistics";
import TransportRequest from "./pages/farmer/TransportRequest";
import FarmerTransportTracking from "./pages/farmer/FarmerTransportTracking";
import FarmerHelp from "./pages/farmer/FarmerHelp";
import FarmerHistory from "./pages/farmer/FarmerHistory";
import FarmerPayments from "./pages/farmer/FarmerPayments";
import FarmerSettings from "./pages/farmer/FarmerSettings";

import TransporterRegister from "./pages/transporter/TransporterRegister";
import TransporterLogin from "./pages/transporter/TransporterLogin";
import TransporterDashboard from "./pages/transporter/TransporterDashboard";
import TransporterJobs from "./pages/transporter/TransporterJobs";
import TransporterTrip from "./pages/transporter/TransporterTrip";
import TransporterEarnings from "./pages/transporter/TransporterEarnings";
import TransporterProfile from "./pages/transporter/TransporterProfile";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminQueue from "./pages/admin/AdminQueue";
import AdminWeighing from "./pages/admin/AdminWeighing";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReports from "./pages/admin/AdminReports";
import AdminFarmers from "./pages/admin/AdminFarmers";
import AdminCenters from "./pages/admin/AdminCenters";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProcurement from "./pages/admin/AdminProcurement";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminPaymentIssues from "./pages/admin/AdminPaymentIssues";
import AdminTransportDashboard from "./pages/admin/AdminTransportDashboard";

import PageTransition from "./components/PageTransition";
import VoiceAssistant from "./components/VoiceAssistant";


function FarmerPortalPage({
  children,
}) {
  return (
    <>
      <VoiceAssistant />

      <PageTransition>
        {children}
      </PageTransition>
    </>
  );
}


function TransporterPortalPage({
  children,
}) {
  return (
    <>
      <PageTransition>
        {children}
      </PageTransition>
    </>
  );
}


function AdminPortalPage({
  children,
}) {
  return (
    <>
      <PageTransition>
        {children}
      </PageTransition>
    </>
  );
}


function App() {
  return (
    <Routes>

      {/* =========================
          LANDING
      ========================== */}

      <Route
        path="/"
        element={
          <Landing />
        }
      />


      {/* =========================
          FARMER PORTAL
      ========================== */}

      <Route
        path="/farmer/login"
        element={
          <PageTransition>
            <FarmerLogin />
          </PageTransition>
        }
      />

      <Route
        path="/farmer/register"
        element={
          <PageTransition>
            <FarmerRegister />
          </PageTransition>
        }
      />

      <Route
        path="/farmer/home"
        element={
          <FarmerPortalPage>
            <FarmerHome />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/book"
        element={
          <FarmerPortalPage>
            <FarmerBook />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/token"
        element={
          <FarmerPortalPage>
            <FarmerToken />
          </FarmerPortalPage>
        }
      />

      {/* Existing farmer transport page */}
      <Route
        path="/farmer/transport"
        element={
          <FarmerPortalPage>
            <FarmerTransport />
          </FarmerPortalPage>
        }
      />

      {/* New Phase 2 farmer logistics hub */}
      <Route
        path="/farmer/logistics"
        element={
          <FarmerPortalPage>
            <FarmerLogistics />
          </FarmerPortalPage>
        }
      />

      {/* New Phase 2 transport request */}
      <Route
        path="/farmer/transport/request"
        element={
          <FarmerPortalPage>
            <TransportRequest />
          </FarmerPortalPage>
        }
      />

      {/* New Phase 2 farmer tracking */}
      <Route
        path="/farmer/transport/tracking/:id"
        element={
          <FarmerPortalPage>
            <FarmerTransportTracking />
          </FarmerPortalPage>
        }
      />

      {/* Optional convenience route to logistics hub */}
      <Route
        path="/farmer/transport/tracking"
        element={
          <FarmerPortalPage>
            <FarmerLogistics />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/history"
        element={
          <FarmerPortalPage>
            <FarmerHistory />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/payments"
        element={
          <FarmerPortalPage>
            <FarmerPayments />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/settings"
        element={
          <FarmerPortalPage>
            <FarmerSettings />
          </FarmerPortalPage>
        }
      />

      <Route
        path="/farmer/help"
        element={
          <FarmerPortalPage>
            <FarmerHelp />
          </FarmerPortalPage>
        }
      />


      {/* =========================
          TRANSPORTER PORTAL
      ========================== */}

      <Route
        path="/transporter/register"
        element={
          <PageTransition>
            <TransporterRegister />
          </PageTransition>
        }
      />

      <Route
        path="/transporter/login"
        element={
          <PageTransition>
            <TransporterLogin />
          </PageTransition>
        }
      />

      <Route
        path="/transporter/dashboard"
        element={
          <TransporterPortalPage>
            <TransporterDashboard />
          </TransporterPortalPage>
        }
      />

      <Route
        path="/transporter/jobs"
        element={
          <TransporterPortalPage>
            <TransporterJobs />
          </TransporterPortalPage>
        }
      />

      <Route
        path="/transporter/trip"
        element={
          <TransporterPortalPage>
            <TransporterTrip />
          </TransporterPortalPage>
        }
      />

      <Route
        path="/transporter/trip/:id"
        element={
          <TransporterPortalPage>
            <TransporterTrip />
          </TransporterPortalPage>
        }
      />

      <Route
        path="/transporter/earnings"
        element={
          <TransporterPortalPage>
            <TransporterEarnings />
          </TransporterPortalPage>
        }
      />

      <Route
        path="/transporter/profile"
        element={
          <TransporterPortalPage>
            <TransporterProfile />
          </TransporterPortalPage>
        }
      />


      {/* =========================
          ADMIN PORTAL
      ========================== */}

      <Route
        path="/admin/login"
        element={
          <PageTransition>
            <AdminLogin />
          </PageTransition>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <PageTransition>
            <AdminDashboard />
          </PageTransition>
        }
      />

      <Route
        path="/admin/queue"
        element={
          <PageTransition>
            <AdminQueue />
          </PageTransition>
        }
      />

      <Route
        path="/admin/weighing"
        element={
          <PageTransition>
            <AdminWeighing />
          </PageTransition>
        }
      />

      <Route
        path="/admin/procurement"
        element={
          <PageTransition>
            <AdminProcurement />
          </PageTransition>
        }
      />

      {/* New Phase 2 admin transport monitor */}
      <Route
        path="/admin/transport"
        element={
          <AdminPortalPage>
            <AdminTransportDashboard />
          </AdminPortalPage>
        }
      />

      <Route
        path="/admin/activity"
        element={
          <PageTransition>
            <AdminActivityLog />
          </PageTransition>
        }
      />

      <Route
        path="/admin/payments"
        element={
          <PageTransition>
            <AdminPayments />
          </PageTransition>
        }
      />

      <Route
        path="/admin/payment-issues"
        element={
          <PageTransition>
            <AdminPaymentIssues />
          </PageTransition>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <PageTransition>
            <AdminReports />
          </PageTransition>
        }
      />

      <Route
        path="/admin/farmers"
        element={
          <PageTransition>
            <AdminFarmers />
          </PageTransition>
        }
      />

      <Route
        path="/admin/centers"
        element={
          <PageTransition>
            <AdminCenters />
          </PageTransition>
        }
      />

      <Route
        path="/admin/settings"
        element={
          <PageTransition>
            <AdminSettings />
          </PageTransition>
        }
      />


      {/* =========================
          FALLBACK
      ========================== */}

      <Route
        path="*"
        element={
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "10px",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <h1>
              Page Not Found
            </h1>

            <p>
              The page you are looking for does not exist.
            </p>
          </div>
        }
      />

    </Routes>
  );
}


export default App;
