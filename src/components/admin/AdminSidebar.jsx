import {
  BarChart3,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Scale,
  Settings,
  Users,
  Wheat,
  X,
} from "lucide-react";

import {
  Link,
  useLocation,
} from "react-router";

import Logo from "../Logo";

import {
  useLanguage,
} from "../../translations/LanguageContext";


function AdminSidebar({
  open = false,
  onClose,
}) {

  const location =
    useLocation();
  const {
  t,
} =
  useLanguage();

  const navigation = [

    {
      section:
        "OPERATIONS",

      items: [

        {
          label:
            t("admin.dashboard"),

          path:
            "/admin/dashboard",

          icon:
            LayoutDashboard,
        },

        {
          label:
            t("admin.liveQueue"),

          path:
            "/admin/queue",

          icon:
            ClipboardList,
        },

        {
          label:
            t("admin.weighing"),

          path:
            "/admin/weighing",

          icon:
            Scale,
        },

        {
          label:
            t("admin.procurement"),

          path:
            "/admin/procurement",

          icon:
            Wheat,
        },

        {
          label:
            t("admin.payments"),

          path:
            "/admin/payments",

          icon:
            CreditCard,
        },

      ],
    },


    {
      section:
        "MANAGEMENT",

      items: [

        {
          label:
            t("admin.farmers"),

          path:
            "/admin/farmers",

          icon:
            Users,
        },

        {
          label:
            t("admin.centers"),

          path:
            "/admin/centers",

          icon:
            MapPin,
        },

        {
          label:
            t("admin.reports"),

          path:
            "/admin/reports",

          icon:
            BarChart3,
        },

      ],
    },


    {
      section:
        "SYSTEM",

      items: [

        {
          label:
            t("admin.activityLog"),

          path:
            "/admin/activity",

          icon:
            FileText,
        },

        {
          label:
            t("admin.settings"),

          path:
            "/admin/settings",

          icon:
            Settings,
        },

      ],
    },

  ];


  function isActive(
    path
  ) {

    if (
      path ===
      "/admin/dashboard"
    ) {

      return (
        location.pathname ===
        path
      );

    }


    return location.pathname.startsWith(
      path
    );

  }


  return (

    <>
      {open && (

        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={
            onClose
          }
          aria-label="Close navigation"
        />

      )}


      <aside
        className={
          `admin-sidebar ${
            open
              ? "open"
              : ""
          }`
        }
      >


        <div className="admin-sidebar-top">


          <Link
            to="/admin/dashboard"
            className="admin-sidebar-brand"
            onClick={
              onClose
            }
          >

            <Logo
              size={48}
            />

            <div>

              <strong>
                KrishiSetu
              </strong>


              <span>
                Operations
              </span>

            </div>

          </Link>


          <button
            type="button"
            className="admin-sidebar-close"
            onClick={
              onClose
            }
            aria-label="Close menu"
          >

            <X size={18} />

          </button>

        </div>



        <div className="admin-center-selector">


          <div className="admin-center-selector-icon">

            <MapPin
              size={16}
            />

          </div>


          <div>

            <span>
              ACTIVE CENTER
            </span>


            <strong>
              Main Procurement Center
            </strong>

          </div>

        </div>



        <nav className="admin-sidebar-nav">


          {navigation.map(
            (group) => (

              <div
                key={
                  group.section
                }
                className="admin-sidebar-group"
              >

                <span className="admin-sidebar-section">
                  {group.section}
                </span>


                <div className="admin-sidebar-items">

                  {group.items.map(
                    (item) => {

                      const Icon =
                        item.icon;


                      const active =
                        isActive(
                          item.path
                        );


                      return (

                        <Link
                          key={
                            item.path
                          }
                          to={
                            item.path
                          }
                          onClick={
                            onClose
                          }
                          className={
                            `admin-sidebar-link ${
                              active
                                ? "active"
                                : ""
                            }`
                          }
                        >

                          <Icon
                            size={17}
                          />


                          <span>
                            {item.label}
                          </span>


                          {active && (

                            <span className="admin-sidebar-active-dot" />

                          )}

                        </Link>

                      );

                    }
                  )}

                </div>

              </div>

            )
          )}

        </nav>



        <div className="admin-sidebar-bottom">


          <div className="admin-sidebar-status">

            <span />


            <div>

              <strong>
                System Online
              </strong>


              <small>
                Database connected
              </small>

            </div>

          </div>


          <Link
            to="/admin/login"
            className="admin-sidebar-logout"
          >

            <LogOut
              size={16}
            />

            Logout

          </Link>

        </div>


      </aside>

    </>

  );
}


export default AdminSidebar;