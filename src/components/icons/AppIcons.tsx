import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function IconBase({ size = 20, className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M10 20v-5h4v5" />
    </IconBase>
  );
}

export function HeadphonesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M4 13v5a2 2 0 0 0 2 2h1v-8H6a2 2 0 0 0-2 2Z" />
      <path d="M20 13v5a2 2 0 0 1-2 2h-1v-8h1a2 2 0 0 1 2 2Z" />
    </IconBase>
  );
}

export function BookOpenIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H12v15H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M20 6.5A2.5 2.5 0 0 0 17.5 4H12v15h5.5A2.5 2.5 0 0 1 20 21.5Z" />
    </IconBase>
  );
}

export function PenToolIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3Z" />
      <path d="M12 3v16" />
    </IconBase>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="8" y="3.5" width="8" height="12" rx="4" />
      <path d="M6 12a6 6 0 0 0 12 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </IconBase>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function WrenchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14.5 4.5a5 5 0 0 0-5.8 6.4L4 15.6l4.4 4.4 4.7-4.7a5 5 0 0 0 6.4-5.8l-2.7 2.7-2.5-.3-.3-2.5 2.7-2.7Z" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="5.5" />
      <path d="m16 16 4 4" />
    </IconBase>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12.5 9.2 16.7 19 7" />
    </IconBase>
  );
}

export function XIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </IconBase>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </IconBase>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 10.5v5" />
      <path d="M12 7.8h.01" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v10" />
      <path d="m8 9 4 4 4-4" />
      <path d="M5 17v2h14v-2" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.5 7.5h6l2 2H20.5v8.5A2 2 0 0 1 18.5 20H5.5A2 2 0 0 1 3.5 18V7.5Z" />
      <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5H9l2 2h9.5" />
    </IconBase>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3.5h6l4 4V20H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
      <path d="M13 3.5V8h4.5" />
      <path d="M9 11h6" />
      <path d="M9 14h6" />
    </IconBase>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M11 6 5 12l6 6" />
      <path d="M19 12H5" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M13 6 19 12l-6 6" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function RepeatIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M17 2.5 21 6.5 17 10.5" />
      <path d="M21 6.5H7a4 4 0 0 0-4 4V12" />
      <path d="M7 21.5 3 17.5 7 13.5" />
      <path d="M3 17.5h14a4 4 0 0 0 4-4V13" />
    </IconBase>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 5.5v13" />
      <path d="M16 5.5v13" />
    </IconBase>
  );
}

export function VolumeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 10.5v3h3l4 4V6.5l-4 4h-3Z" />
      <path d="M16 9.5a3 3 0 0 1 0 5" />
      <path d="M18.5 7a6 6 0 0 1 0 10" />
    </IconBase>
  );
}

export function MoreHorizontalIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5Z" />
      <path d="M13.5 7 17 3.5 20.5 7 17 10.5" />
    </IconBase>
  );
}

export function SaveIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 4.5h10l3 3V19.5H5z" />
      <path d="M8 4.5v6h7v-6" />
      <path d="M8 19.5v-6h8v6" />
    </IconBase>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M13 3.5c0 2.2 1.5 3.2 1.5 5.2 0 1.4-.7 2.6-1.8 3.3-.5-.8-.7-1.8-.5-2.8-1.9 1-3.2 3-3.2 5.3 0 2.8 2.2 5 5 5s5-2.2 5-5c0-4.8-3.2-7.2-6-11Z" />
      <path d="M10.5 15.5c0-1.7.9-3.1 2.3-4" />
    </IconBase>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 6.5h14" />
      <path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5" />
      <path d="M8 6.5l.5 11A1.5 1.5 0 0 0 10 19h4a1.5 1.5 0 0 0 1.5-1.5l.5-11" />
      <path d="M10.5 10v5" />
      <path d="M13.5 10v5" />
    </IconBase>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </IconBase>
  );
}
