import { ConfirmButton, ConfirmButtonProps } from '../../Button/ConfirmButton';

type Props = Pick<
  ConfirmButtonProps,
  'onClick' | 'className' | 'tooltipPositon'
>;

export const ClearBoardIconButton = (props: Props) => (
  <ConfirmButton
    iconButton
    icon="TrashIcon"
    iconKind="outline"
    type="clear"
    size="sm"
    tooltip="Clear Board"
    tooltipPositon="left"
    confirmModalTitle="Clear Board"
    confirmModalContent="You're about to clear the board. Are you sure?"
    {...props}
  />
);
