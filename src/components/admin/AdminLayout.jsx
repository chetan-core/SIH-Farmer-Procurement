import {
  useEffect,
  useState,
} from "react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import {
  MessageCircleWarning,
} from "lucide-react";


function AdminLayout({
  children,
  title,
  subtitle,
}) {

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    language,
    setLanguage,
  ] = useState(
    () =>
      localStorage.getItem(
        "krishisetu-language"
      ) || "en"
  );


  function changeLanguage(
    value
  ) {

    setLanguage(
      value
    );


    localStorage.setItem(
      "krishisetu-language",
      value
    );


    window.dispatchEvent(
      new CustomEvent(
        "krishisetu-language-change",
        {
          detail: {
            language: value,
          },
        }
      )
    );

    <Link
  to="/admin/payment-issues"
  className="admin-sidebar-link"
>
  <MessageCircleWarning
    size={18}
  />

  <span>
    Payment Issues
  </span>
</Link>
  }


  useEffect(() => {

    function handleLanguageChange(
      event
    ) {

      const nextLanguage =
        event?.detail?.language ||
        localStorage.getItem(
          "krishisetu-language"
        ) ||
        "en";


      setLanguage(
        nextLanguage
      );

    }


    window.addEventListener(
      "krishisetu-language-change",
      handleLanguageChange
    );


    return () => {

      window.removeEventListener(
        "krishisetu-language-change",
        handleLanguageChange
      );

    };

  }, []);


  async function handleRefresh() {

    if (
      refreshing
    ) {
      return;
    }


    setRefreshing(
      true
    );


    window.dispatchEvent(
      new CustomEvent(
        "krishisetu-admin-refresh"
      )
    );


    setTimeout(() => {

      setRefreshing(
        false
      );

    }, 500);

  }


  return (

    <div className="admin-layout">


      <AdminSidebar
        open={
          sidebarOpen
        }
        onClose={() =>
          setSidebarOpen(
            false
          )
        }
      />


      <div className="admin-layout-main">


        <AdminHeader
          title={
            title ||
            "Operations Dashboard"
          }

          subtitle={
            subtitle
          }

          onMenuClick={() =>
            setSidebarOpen(
              true
            )
          }

          onRefresh={
            handleRefresh
          }

          refreshing={
            refreshing
          }

          language={
            language
          }

          onLanguageChange={
            changeLanguage
          }
        />


        <main className="admin-layout-content">

          {children}

        </main>


      </div>

    </div>

  );
}


export default AdminLayout;