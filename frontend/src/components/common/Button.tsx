import type { ButtonProps } from "../../types";
import Icons from "../common/icons/Icons.tsx";

const Button: React.FC<ButtonProps> = ({
  title,
  bgColor,
  color,
  hoverColor,
  onClick,
}) => {
  return (
    <button
      className={`flex items-center px-6 py-3 rounded-lg font-semibold cursor-pointer transition duration-300 gap-2 ${bgColor} ${color} ${hoverColor}`}
      onClick={onClick}
    >
      <Icons name="plus" /> {title}
    </button>
  );
};

export default Button;
