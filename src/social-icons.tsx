import * as React from "react";
import { Globe } from "lucide-react";
// One file per icon, never the package root: its barrel re-exports about 3,400
// icon modules, and Node loads every one of them for any importer of this
// package that is not bundled (each kit's tests, and this package's own).
import SiFacebook from "@icons-pack/react-simple-icons/icons/SiFacebook.mjs";
import SiInstagram from "@icons-pack/react-simple-icons/icons/SiInstagram.mjs";
import SiTiktok from "@icons-pack/react-simple-icons/icons/SiTiktok.mjs";

export type SocialLinks = {
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
};

/**
 * Shared vendor social-link field list: real brand marks + official colors
 * (via Simple Icons, `color="default"`) everywhere a link is shown or
 * edited. `website` has no brand mark — a generic globe, tinted by the
 * caller via currentColor.
 */
export const SOCIAL_LINK_FIELDS: {
  key: keyof SocialLinks;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}[] = [
  { key: "website", label: "Website", icon: Globe },
  {
    key: "instagram",
    label: "Instagram",
    icon: (props) => <SiInstagram color="default" {...props} />,
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: (props) => <SiFacebook color="default" {...props} />,
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: (props) => <SiTiktok color="default" {...props} />,
  },
];
