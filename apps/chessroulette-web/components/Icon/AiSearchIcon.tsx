import React from 'react';

// Outpost "AI search" icon: magnifying glass + sparkles (outline style of the
// sidebar star-blue icon). Uses currentColor, so it follows the text color.
export const AiSearchIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <circle cx="10" cy="14" r="6" stroke="currentColor" strokeWidth="2.5" />
    <path
      d="M14.4 18.4L19.5 23"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M18.4 2C19.2 4.4 20 5.2 22.4 6C20 6.8 19.2 7.6 18.4 10C17.6 7.6 16.8 6.8 14.4 6C16.8 5.2 17.6 4.4 18.4 2Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M12.6 1.1C12.87 2.06 13.14 2.33 14.1 2.6C13.14 2.87 12.87 3.14 12.6 4.1C12.33 3.14 12.06 2.87 11.1 2.6C12.06 2.33 12.33 2.06 12.6 1.1Z"
      fill="currentColor"
    />
  </svg>
);
