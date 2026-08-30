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
import FarmerHelp from "./pages/farmer/FarmerHelp";

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
import FarmerHistory from "./pages/farmer/FarmerHistory";
import FarmerPayments from "./pages/farmer/FarmerPayments";
import AdminPaymentIssues from "./pages/admin/AdminPaymentIssues";
import PageTransition from "./components/PageTransition";
import FarmerSettings from "./pages/farmer/FarmerSettings";
function App() {

  return (

    <Routes>

      {/* Main portal */}
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
          <FarmerRegister />
        }
      />

      <Route
  path="/farmer/home"
  element={
    <PageTransition>
      <FarmerHome />
    </PageTransition>
  }
/>


      <Route
        path="/farmer/book"
        element={
          <FarmerBook />
        }
      />

      <Route
        path="/farmer/token"
        element={
          <FarmerToken />
        }
      />
      <Route
  path="/farmer/history"
  element={<FarmerHistory />}
/>
<Route
  path="/farmer/payments"
  element={
    <FarmerPayments />
  }
/>
<Route
  path="/farmer/settings"
  element={
    <FarmerSettings />
  }
/>

      <Route
        path="/farmer/help"
        element={
          <FarmerHelp />
        }
      />


      {/* =========================
          ADMIN / OPERATIONS PORTAL
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
          <AdminQueue />
        }
      />

      <Route
        path="/admin/weighing"
        element={
          <AdminWeighing />
        }
      />
      <Route
  path="/admin/procurement"
  element={
    <AdminProcurement />
  }
/>
<Route
  path="/admin/activity"
  element={
    <AdminActivityLog />
  }
/>

      <Route
        path="/admin/payments"
        element={
          <AdminPayments />
        }
      />
      <Route
  path="/admin/payment-issues"
  element={
    <AdminPaymentIssues />
  }
/>

      <Route
        path="/admin/reports"
        element={
          <AdminReports />
        }
      />
      <Route
  path="/admin/farmers"
  element={<AdminFarmers />}
/>
<Route
  path="/admin/centers"
  element={
    <AdminCenters />
  }
/>
<Route
  path="/admin/settings"
  element={
    <AdminSettings />
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
              The page you are looking for
              does not exist.
            </p>

          </div>
        }
      />

    </Routes>
  );
}


export default App;