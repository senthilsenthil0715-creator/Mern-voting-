import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  if (!token) return null;

  const isAdmin = user.role === 'admin';

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link to={isAdmin ? '/admin' : '/'} className="nav__brand">
          <Logo />
          <span>Ballot</span>
        </Link>
        <nav className="nav__links">
          {isAdmin ? (
            <>
              <NavLink to="/admin" end>Dashboard</NavLink>
              <NavLink to="/admin/elections/new">New election</NavLink>
            </>
          ) : (
            <NavLink to="/" end>Elections</NavLink>
          )}
        </nav>
        <div className="nav__user">
          <span className="nav__who">
            {user.name}
            <small>{isAdmin ? 'Administrator' : 'Voter'}</small>
          </span>
          <button
            className="btn btn--light btn--sm"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
