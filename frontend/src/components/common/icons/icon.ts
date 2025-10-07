import {
  faUser,
  faEnvelope,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export const icons = {
  user: faUser,
  envelope: faEnvelope,
  plus: faPlus,
  xmark: faXmark,
} as const;

export type IconName = keyof typeof icons;
