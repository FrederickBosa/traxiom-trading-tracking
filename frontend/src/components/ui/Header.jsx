import { useState, useRef, useEffect } from 'react';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import useAuth from '../../hooks/useAuth.js';
import { signOut } from '../../services/supabase.js';

function Header({ onOpenSidebar }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const email = user?.email ?? '';
  const displayName = user?.user_metadata?.full_name ?? email.split('@')[0];
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
  }

  return (
    <header className="tt-header">
      {/* Botón hamburguesa — visible solo en mobile/tablet */}
      <button
        className="tt-header__hamburger"
        onClick={onOpenSidebar}
        aria-label="Abrir menú"
      >
        <MenuRoundedIcon sx={{ fontSize: 22 }} />
      </button>

      <div className="tt-header__profile" ref={dropdownRef}>
        <button
          className={`tt-header__trigger${isOpen ? ' tt-header__trigger--open' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Menú de usuario: ${displayName}`}
        >
          <div className="tt-header__avatar" aria-hidden="true">{initials}</div>
          <div className="tt-header__trigger-info">
            <span className="tt-header__trigger-name">{displayName}</span>
          </div>
          <span className="tt-header__chevron" aria-hidden="true">
            {isOpen
              ? <KeyboardArrowUpRoundedIcon sx={{ fontSize: 18 }} />
              : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
            }
          </span>
        </button>

        {isOpen && (
          <div className="tt-header__dropdown" role="menu">
            <div className="tt-header__dropdown-user">
              <div className="tt-header__dropdown-avatar" aria-hidden="true">{initials}</div>
              <div className="tt-header__dropdown-user-info">
                <span className="tt-header__dropdown-fullname">{displayName}</span>
                <span className="tt-header__dropdown-role">{email}</span>
              </div>
            </div>

            <div className="tt-header__dropdown-divider" />

            <button className="tt-header__dropdown-item" role="menuitem">
              <span className="tt-header__dropdown-item-icon">
                <SettingsRoundedIcon sx={{ fontSize: 16 }} />
              </span>
              Configuración
            </button>

            <button className="tt-header__dropdown-item" role="menuitem">
              <span className="tt-header__dropdown-item-icon">
                <InfoRoundedIcon sx={{ fontSize: 16 }} />
              </span>
              Acerca de
            </button>

            <div className="tt-header__dropdown-divider" />

            <button
              className="tt-header__dropdown-item tt-header__dropdown-item--danger"
              role="menuitem"
              onClick={handleSignOut}
            >
              <span className="tt-header__dropdown-item-icon">
                <LogoutRoundedIcon sx={{ fontSize: 16 }} />
              </span>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
