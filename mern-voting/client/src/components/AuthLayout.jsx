import Logo from './Logo.jsx';

export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <div className="auth__logo">
          <Logo size={34} />
          <span>Ballot</span>
        </div>
        <div className="auth__pitch">
          <h1>Every voice counted. Every vote verified.</h1>
          <p>Secure online elections with email verification at every sign-in, one vote per person, and transparent results.</p>
        </div>
        <ul className="auth__points">
          <li>Email one-time codes protect every account</li>
          <li>One vote per voter, enforced by the database</li>
          <li>Results published only when voting closes</li>
        </ul>
      </aside>
      <main className="auth__main">{children}</main>
    </div>
  );
}
