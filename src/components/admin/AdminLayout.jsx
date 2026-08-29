
import {
  useState,
} from "react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

import {
  useLanguage,
} from "../../translations/LanguageContext";


function AdminLayout({
  children,
  title,
  subtitle,
}) {

  const [
    sidebarOpen,
    setSidebarOpen,
  ] =
    useState(false);


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  const {
    language,
    setLanguage,
  } =
    useLanguage();


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


    setTimeout(
      () => {

        setRefreshing(
          false
        );

      },
      500
    );

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
            setLanguage
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
