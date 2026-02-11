import * as SolidIcons from '@heroicons/react/16/solid';
import * as OutlineIcons from '@heroicons/react/24/outline';
import { keyInObject } from '@/lib/misc';

const iconKinds = {
  solid: SolidIcons,
  outline: OutlineIcons,
};

export type IconProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  name: keyof typeof SolidIcons | keyof typeof OutlineIcons;
  kind?: keyof typeof iconKinds;
  className?: string;
};

export const Icon = ({
  name: icon,
  kind = 'solid',
  className,
  ...props
}: IconProps) => {
  const x = iconKinds[kind];
  if (!keyInObject(x, icon)) {
    return null;
  }

  const Icon = x[icon] as React.ElementType;

  return <Icon className={className} {...props} />;
};
