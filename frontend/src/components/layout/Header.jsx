import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-logo">IDP Platform</h1>
      </div>
      <div className="header-right">
        <button onClick={toggleTheme} className="btn-icon">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="user-menu">
          <span>{user?.name}</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
