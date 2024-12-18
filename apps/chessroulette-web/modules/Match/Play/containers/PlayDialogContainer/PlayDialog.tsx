import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { invoke, objectKeys } from '@xmatter/util-kit';
import { Dialog } from '@app/components/Dialog';
import { ClipboardCopyButton } from '@app/components/ClipboardCopyButton';
import { GameOffer } from '@app/modules/Game';
import { useGame } from '@app/modules/Game/hooks';

export type GameStateDialogProps = {
  onAcceptOffer: ({ offer }: { offer: GameOffer['type'] }) => void;
  onDenyOffer: () => void;
  onCancelOffer: () => void;
  inviteLink?: string;
};

export const PlayDialog: React.FC<GameStateDialogProps> = ({
  onAcceptOffer,
  onDenyOffer,
  onCancelOffer,
  inviteLink,
}) => {
  const [gameResultSeen, setGameResultSeen] = useState(false);

  // TODO: Change the useGame to useMatchPlay
  const {
    lastOffer,
    committedState: { game },
    players,
    playerId,
  } = useGame();

  const gameUsed = useGame();

  useEffect(() => {
    // Everytime the game state changes, reset the seen!
    setGameResultSeen(false);
  }, [game.status]);

  return invoke(() => {
    if (game.status === 'pending' && objectKeys(players || {}).length < 2) {
      return (
        <Dialog
          title="Waiting for Opponent"
          content={
            <div className="w-full flex justify-center">
              {inviteLink && (
                <ClipboardCopyButton
                  buttonComponentType="Button"
                  value={inviteLink}
                  render={(copied) => (
                    <>
                      {copied ? (
                        <Link
                          href={inviteLink}
                          target="_blank"
                          className="bg-transparent"
                          onClick={(e) => e.preventDefault()}
                        >
                          <div className="bg-green-400 text-black p-3 rounded-xl">
                            Copied
                          </div>
                        </Link>
                      ) : (
                        <div className="bg-purple-400 p-3 text-black rounded-xl">
                          Copy Invite URL
                        </div>
                      )}
                    </>
                  )}
                  type="clear"
                  size="sm"
                />
              )}
            </div>
          }
        />
      );
    }

    if (lastOffer) {
      if (game.status === 'complete' && !gameResultSeen) {
        setGameResultSeen(true);
      }
      if (lastOffer.type === 'rematch') {
        if (lastOffer.status === 'pending') {
          if (lastOffer.byPlayer === playerId) {
            return (
              <Dialog
                title="Rematch ?"
                content={
                  <div className="flex justify-center content-center">
                    Waiting for your opponent to respond.
                  </div>
                }
                buttons={[
                  {
                    children: 'Cancel',
                    bgColor: 'red',
                    onClick: () => {
                      onCancelOffer();
                      setGameResultSeen(true);
                    },
                  },
                ]}
              />
            );
          }
          return (
            <Dialog
              title="Rematch Offer"
              content={
                <div className="flex justify-center content-center">
                  You have been invited for a rematch!
                </div>
              }
              buttons={[
                {
                  children: 'Accept',
                  bgColor: 'green',
                  onClick: () => {
                    onAcceptOffer({ offer: 'rematch' });
                    setGameResultSeen(true);
                  },
                },
                {
                  children: 'Deny',
                  bgColor: 'red',
                  onClick: () => {
                    onDenyOffer();
                    setGameResultSeen(true);
                  },
                },
              ]}
            />
          );
        }

        if (lastOffer.status === 'denied') {
          if (lastOffer.byPlayer === playerId) {
            return (
              <Dialog
                title="Offer Denied"
                content={
                  <div className="flex justify-center content-center">
                    Rematch offer has been denied.
                  </div>
                }
                buttons={[
                  {
                    children: 'Ok',
                    bgColor: 'blue',
                    onClick: () => {
                      setGameResultSeen(true);
                    },
                  },
                ]}
              />
            );
          }
        }
      }

      if (lastOffer.type === 'draw' && lastOffer.status === 'pending') {
        if (lastOffer.byPlayer === playerId) {
          return (
            <Dialog
              title="Draw Offer"
              content={
                <div className="flex justify-center content-center">
                  Waiting for your opponent to respond.
                </div>
              }
              buttons={[
                {
                  children: 'Cancel',
                  bgColor: 'red',
                  onClick: () => {
                    onCancelOffer();
                    setGameResultSeen(true);
                  },
                },
              ]}
            />
          );
        }

        return (
          <Dialog
            title="Draw Offer"
            content={
              <div className="flex justify-center content-center">
                Your opponent offers you a draw!
              </div>
            }
            buttons={[
              {
                children: 'Accept',
                bgColor: 'green',
                onClick: () => {
                  onAcceptOffer({ offer: 'draw' });
                  setGameResultSeen(true);
                },
              },
              {
                children: 'Deny',
                bgColor: 'red',
                onClick: () => {
                  onDenyOffer();
                  setGameResultSeen(true);
                },
              },
            ]}
          />
        );
      }

      if (lastOffer.type === 'takeback') {
        if (lastOffer.status === 'pending') {
          if (lastOffer.byPlayer === playerId) {
            return (
              <Dialog
                title="Takeback Offer"
                content={
                  <div className="flex justify-center content-center">
                    Waiting for your opponent to respond.
                  </div>
                }
                buttons={[
                  {
                    children: 'Cancel',
                    bgColor: 'red',
                    onClick: () => {
                      onCancelOffer();
                      setGameResultSeen(true);
                    },
                  },
                ]}
              />
            );
          }

          return (
            <Dialog
              title="Takeback Offer"
              content={
                <div className="flex justify-center content-center">
                  Your opponent asks you for a takeback!
                </div>
              }
              buttons={[
                {
                  children: 'Accept',
                  bgColor: 'green',
                  onClick: () => {
                    onAcceptOffer({ offer: 'takeback' });
                    setGameResultSeen(true);
                  },
                },
                {
                  children: 'Deny',
                  bgColor: 'red',
                  onClick: () => {
                    onDenyOffer();
                    setGameResultSeen(true);
                  },
                },
              ]}
            />
          );
        }

        if (lastOffer.status === 'denied' && !gameResultSeen) {
          if (lastOffer.byPlayer === playerId) {
            return (
              <Dialog
                title="Offer Denied"
                content={
                  <div className="flex justify-center content-center">
                    Takeback offer has been denied.
                  </div>
                }
                buttons={[
                  {
                    children: 'Ok',
                    bgColor: 'blue',
                    onClick: () => {
                      setGameResultSeen(true);
                    },
                  },
                ]}
              />
            );
          }
        }
      }
    }

    return null;
  });
};
