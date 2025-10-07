import type { LayoutProps } from "../../types";
import { Link } from "react-router-dom";

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <nav className="flex gap-4 p-4 bg-gray-800 text-white">
        <Link to="/">Claims</Link>
        <Link to="/about">Reports</Link>
        <Link to="/contact">Settings</Link>
      </nav>
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
};

export default Layout;
