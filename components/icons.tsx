type IconProps = { className?: string; strokeWidth?: number }

function Svg({ className = 'size-6', strokeWidth = 1.8, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Svg>
)
export const ChildrenIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M16.5 14.6c2.4.2 4.2 1.9 5 4.9" />
  </Svg>
)
export const RulerIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
    <path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4" />
  </Svg>
)
export const ShoeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 9.2C4.3 10.8 3.5 12.9 3.1 14.6c-.5 2 .9 3.4 3.4 3.4h12.2c2.1 0 3.1-1.2 2.7-2.6-.4-1.4-1.8-2.2-3.7-2.6l-1.6-.4" />
    <path d="M3.2 15.4c3 .6 6.6.4 9.6.1 3.2-.3 5.8.1 8.3-.4" />
    <path d="M5 9.2c.8.6 2.2.9 3.9.4l1.2-.4" />
    <path d="M5 9.2c-.9-.5-1.2-1.4-.8-2 .4-.5 1.2-.4 1.4.4l.2 1.1" />
    <path d="M9.2 12.3l3.9-3.5c.4-.3.9-.3 1.2 0l.6.6c.3.3.3.8 0 1.1l-3.9 3.5c-.4.3-.9.3-1.2 0l-.6-.6c-.3-.3-.3-.8 0-1.1z" />
    <path d="M12.6 15.1l3.1-2.9c.4-.3.9-.3 1.2 0l.5.5c.3.3.3.8 0 1.1l-1.7 1.6" />
  </Svg>
)
export const ProfileIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" />
  </Svg>
)
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
)
export const BackIcon = (p: IconProps) => (
  <Svg {...p}><path d="M15 5l-7 7 7 7" /></Svg>
)
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
)
export const MailIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
  </Svg>
)
export const ChartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 20h18" />
    <path d="M4 16l5-5 4 3 7-8" />
  </Svg>
)
export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
)
export const CameraIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </Svg>
)
export const EditIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /></Svg>
)
