import type { HeaderProps } from "../../types";

const Header: React.FC<HeaderProps> = ({ claim }) => {
  return (
    <div>
      <h1 className="text-white font-bold text-4xl">{claim}</h1>
    </div>
  );
};

export default Header;
