import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProps } from "../../../types/index";
import { icons } from "./icon";

const Icons: React.FC<IconProps> = ({ name, className }) => {
  return <FontAwesomeIcon icon={icons[name]} className={className} />;
};

export default Icons;
