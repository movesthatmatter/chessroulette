import { ConfirmButton, ConfirmButtonProps } from '../../Button/ConfirmButton';

type Props = Pick<
  ConfirmButtonProps,
  'onClick' | 'className' | 'tooltipPositon'
>;

export const StartPositionIconButton = (props: Props) => (
  <ConfirmButton
    iconButton
    icon="PlusCircleIcon"
    iconKind="outline"
    type="clear"
    size="sm"
    tooltip="Start Position"
    tooltipPositon="left"
    confirmModalTitle="Reset to Starting Position"
    confirmModalContent="You're about to reset the board to the starting position. Are you sure?"
    {...props}
  />
);
