type Props = {
  label: string;
  value?: boolean;
  onUpdate?: (v: boolean) => void;
  labelPosition?: 'right' | 'left';
  labelClassName?: string;
} & React.DetailedHTMLProps<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  HTMLLabelElement
>;

export const Switch = ({
  label,
  value = false,
  labelPosition = 'right',
  className,
  labelClassName,
  onUpdate,
  ...labelProps
}: Props) => (
  <label
    className={`inline-flex items-center cursor-pointer gap-2 ${
      labelPosition === 'left' && 'flex-row-reverse'
    } ${className}`}
    title={label}
    {...labelProps}
  >
    <input
      type="checkbox"
      // value={Number(value)}
      checked={value}
      className="sr-only peer"
      onChange={() => onUpdate?.(!value)}
    />
    <div
      className="
      relative w-9 h-5 bg-slate-500 peer-focus:outline-none
      peer-focus:ring-2 peer-focus:ring-blue-500
      rounded-full peer peer-checked:after:translate-x-full
      rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white
      after:content-[''] after:absolute after:top-[2px] after:start-[2px]
      after:bg-white after:border-gray-300 after:border after:rounded-full
      after:h-4 after:w-4 after:transition-all 
      peer-checked:bg-blue-600"
    />
    {label && (
      <span className={`ms-3 text-sm font-medium ${labelClassName}`}>
        {label}
      </span>
    )}
  </label>
);
