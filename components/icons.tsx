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
    <path d="M3 16.5V8.5C3 7.7 3.7 7 4.5 7H7l1.5 3h3l5.5 2.5c2.3 1 4 2.1 4 3.8v.2c0 .8-.7 1.5-1.5 1.5h-15C3.7 18 3 17.3 3 16.5z" />
    <path d="M3 14.5h18.5" />
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
