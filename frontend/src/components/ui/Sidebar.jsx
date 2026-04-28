import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', Icon: DashboardRoundedIcon },
  { id: 'plan', label: 'Trading Plan', Icon: AssignmentRoundedIcon },
];

const TOOLS = [
  { name: 'TradingView', Icon: ShowChartRoundedIcon, url: 'https://www.tradingview.com' },
  { name: 'Investing.com', Icon: ArticleRoundedIcon, url: 'https://es.investing.com/economic-calendar' },
  { name: 'Calc. Lotaje', Icon: CalculateRoundedIcon, url: 'https://www.cashbackforexusa.com/es/tools/position-size-calculator' },
  { name: 'Forex Factory', Icon: CalendarMonthRoundedIcon, url: 'https://www.forexfactory.com' },
  { name: 'DailyFX', Icon: TrendingUpRoundedIcon, url: 'https://www.dailyfx.com' },
  { name: 'Babypips', Icon: SchoolRoundedIcon, url: 'https://www.babypips.com' },
];

function Sidebar({ activeTab, onTabChange, open, onClose }) {
  return (
    <>
      {/* Backdrop — visible solo en mobile/tablet cuando el drawer está abierto */}
      {open && <div className="tt-sidebar__backdrop" onClick={onClose} aria-hidden="true" />}

      <aside
        className={`tt-sidebar${open ? ' tt-sidebar--open' : ''}`}
        aria-label="Navegación principal"
      >
      {/* Botón cerrar — solo en mobile/tablet */}
      <button className="tt-sidebar__close" onClick={onClose} aria-label="Cerrar menú">
        <CloseRoundedIcon sx={{ fontSize: 18 }} />
      </button>

      {/* Brand */}
      <div className="tt-sidebar__brand">
        <span className="tt-sidebar__brand-icon">
          <AutoGraphRoundedIcon sx={{ fontSize: 22 }} />
        </span>
        <div>
          <span className="tt-sidebar__brand-name">Trading Journal</span>
          <span className="tt-sidebar__brand-version">v1.0</span>
        </div>
      </div>

      <div className="tt-sidebar__inner">
        {/* Navigation */}
        <div className="tt-sidebar__section">
          <p className="tt-sidebar__section-label">Navegación</p>
          <nav className="tt-sidebar__nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`tt-sidebar__nav-item${activeTab === item.id ? ' tt-sidebar__nav-item--active' : ''}`}
                onClick={() => onTabChange(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <span className="tt-sidebar__nav-icon">
                  <item.Icon sx={{ fontSize: 18 }} />
                </span>
                <span className="tt-sidebar__nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="tt-sidebar__divider" />

        {/* Tool shortcuts */}
        <div className="tt-sidebar__section">
          <p className="tt-sidebar__section-label">Herramientas</p>
          <div className="tt-sidebar__tools">
            {TOOLS.map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tt-sidebar__tool-link"
                title={tool.name}
              >
                <span className="tt-sidebar__tool-icon">
                  <tool.Icon sx={{ fontSize: 16 }} />
                </span>
                <span className="tt-sidebar__tool-name">{tool.name}</span>
                <OpenInNewRoundedIcon sx={{ fontSize: 13, opacity: 0.5 }} />
              </a>
            ))}
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}

export default Sidebar;
