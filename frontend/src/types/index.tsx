import type { IconName } from "../components/common/icons/icon";

export interface SearchProps {}

export interface HeaderProps {
  claim: string;
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface DataProps {
  Claimant: string;
  ClaimID: string;
  PolicyNumber: string;
  date: string;
  status: "Pending" | "approved" | "rejected";
  riskScore: number;
  riskBar: number;
  description?: string;
  doc?: File;
}

export interface IconProps {
  name: IconName;
  className?: string;
}

export interface ButtonProps {
  bgColor: string;
  color: string;
  hoverColor: string;
  title: string;
  onClick?: () => void;
}
