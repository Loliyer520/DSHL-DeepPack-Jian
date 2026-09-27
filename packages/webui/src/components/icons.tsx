import React from "react";

// 统一线性图标集：1.5px 圆头描边，尺寸随调用方，颜色随 currentColor。
// 全站禁用 emoji 图标——小作坊感的一半来自 ✂♪🔇 混排在真实产品里。
const base = (size: number | undefined, children: React.ReactNode) => (
  <svg
    width={size ?? 14}
    height={size ?? 14}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

export const IconPlus: React.FC<{ size?: number }> = ({ size }) =>
  base(size, <path d="M8 3v10M3 8h10" />);

export const IconClose: React.FC<{ size?: number }> = ({ size }) =>
  base(size, <path d="M4 4l8 8M12 4l-8 8" />);

export const IconScissors: React.FC<{ size?: number }> = ({ size }) =>
  base(
    size,
    <>
      <circle cx="4" cy="4.5" r="1.8" />
      <circle cx="4" cy="11.5" r="1.8" />
      <path d="M5.6 5.6L13 12M5.6 10.4L13 4" />
    </>,
  );

export const IconNote: React.FC<{ size?: number }> = ({ size }) =>
  base(
    size,
    <>
      <path d="M6 12.5V4l7-1.5V11" />
      <circle cx="4.2" cy="12.5" r="1.8" />
      <circle cx="11.2" cy="11" r="1.8" />
    </>,
  );

export const IconVolume: React.FC<{ size?: number; off?: boolean }> = ({ size, off }) =>
  base(
    size,
    off ? (
      <>
        <path d="M3 6.5h2L8.5 3.5v9L5 9.5H3z" />
        <path d="M11 6.5l3.5 3.5M14.5 6.5L11 10" />
      </>
    ) : (
      <>
        <path d="M3 6.5h2L8.5 3.5v9L5 9.5H3z" />
        <path d="M11 5.5a4 4 0 010 5M13 3.5a7 7 0 010 9" />
      </>
    ),
  );

export const IconSparkle: React.FC<{ size?: number }> = ({ size }) =>
  base(
    size,
    <path d="M8 2.5l1.4 3.6L13 7.5l-3.6 1.4L8 12.5 6.6 8.9 3 7.5l3.6-1.4zM12.5 11.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" />,
  );

export const IconGrip: React.FC<{ size?: number }> = ({ size }) => (
  <svg width={size ?? 10} height={size ?? 14} viewBox="0 0 8 14" fill="currentColor" aria-hidden>
    <circle cx="2" cy="3" r="1.1" />
    <circle cx="6" cy="3" r="1.1" />
    <circle cx="2" cy="7" r="1.1" />
    <circle cx="6" cy="7" r="1.1" />
    <circle cx="2" cy="11" r="1.1" />
    <circle cx="6" cy="11" r="1.1" />
  </svg>
);

export const IconFilm: React.FC<{ size?: number }> = ({ size }) =>
  base(
    size,
    <>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M5 3v10M11 3v10M2 6.5h3M2 9.5h3M11 6.5h3M11 9.5h3" />
    </>,
  );

export const IconLayers: React.FC<{ size?: number }> = ({ size }) =>
  base(
    size,
    <>
      <path d="M8 2l6 3.2L8 8.5 2 5.2z" />
      <path d="M2 8.4l6 3.2 6-3.2M2 11.4l6 3.2 6-3.2" />
    </>,
  );

export const IconText: React.FC<{ size?: number }> = ({ size }) =>
  base(size, <path d="M3 4.5V3h10v1.5M8 3v10M6 13h4" />);

export const IconSun: React.FC<{ size?: number }> = ({ size }) =>
  base(
    size,
    <>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M12.6 3.4l-1.3 1.3M4.7 11.3l-1.3 1.3" />
    </>,
  );

export const IconMoon: React.FC<{ size?: number }> = ({ size }) =>
  base(size, <path d="M13.5 9.5A5.8 5.8 0 116.5 2.5a4.6 4.6 0 007 7z" />);

export const IconPanel: React.FC<{ size?: number }> = ({ size }) =>
  base(
    size,
    <>
      <rect x="1.8" y="2.8" width="12.4" height="10.4" rx="2" />
      <path d="M6 2.8v10.4" />
    </>,
  );

export const IconChevronLeft: React.FC<{ size?: number }> = ({ size }) =>
  base(size, <path d="M9.5 3.5L5 8l4.5 4.5" />);

export const IconClapper: React.FC<{ size?: number }> = ({ size }) =>
  base(
    size,
    <>
      <path d="M2.5 6h11v6a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 12z" />
      <path d="M2.8 6L4 2.8l9.4 1.7-.6 1.5M7.2 3.5L6 6M10.6 4.1L9.4 6.6" />
    </>,
  );
