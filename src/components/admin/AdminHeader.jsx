import {
  Globe2,
  Menu,
  RefreshCw,
} from "lucide-react";


function AdminHeader({
  title,
  subtitle,
  onMenuClick,
  onRefresh,
  refreshing,
  language = "en",
  onLanguageChange,
}) {

  return (

    <header className="admin-header">


      <div className="admin-header-left">


        <button
          type="button"
          className="admin-mobile-menu"
          onClick={
            onMenuClick
          }
        >

          <Menu
            size={20}
          />

        </button>


        <div className="admin-header-title">

          <h1>
            {title}
          </h1>


          {subtitle && (

            <p>
              {subtitle}
            </p>

          )}

        </div>

      </div>



      <div className="admin-header-actions">


        <div className="admin-language-selector">


          <Globe2
            size={15}
          />


          <select
            value={
              language
            }
            onChange={(event) =>
              onLanguageChange?.(
                event.target.value
              )
            }
            aria-label="Language"
          >

            <option value="en">
              English
            </option>

            <option value="hi">
              हिन्दी
            </option>

            <option value="te">
              తెలుగు
            </option>

          </select>

        </div>


        <button
          type="button"
          className="admin-header-refresh"
          onClick={
            onRefresh
          }
          disabled={
            refreshing
          }
        >

          <RefreshCw
            size={15}
            className={
              refreshing
                ? "admin-refresh-spin"
                : ""
            }
          />


          <span>

            {
              refreshing
                ? "Refreshing..."
                : "Refresh"
            }

          </span>

        </button>

      </div>

    </header>

  );
}


export default AdminHeader;