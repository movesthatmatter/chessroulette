import React, { useState } from 'react';
import { TextArea } from '../TextArea';
import { Button } from '../Button';
import { ChessFEN, ChessPGN, isValidPgn } from '@/lib/ChessRouler';
import { DragAndDrop } from './DragAndDrop';
import { Err, Ok, Result } from 'ts-results';
import useDebouncedEffect from 'use-debounced-effect';
import { ChessFENBoard } from '@/lib/ChessFENBoard';

export type ImportedInput =
  | { type: 'FEN'; val: ChessFEN }
  | { type: 'PGN'; val: ChessPGN };

export type PgnInputBoxProps = {
  onChange: (p: ImportedInput) => void;
  value?: string;
  isInvalid?: boolean;
  containerClassName?: string;
  contentClassName?: string;
  compact?: boolean;
};

export const PgnInputBox: React.FC<PgnInputBoxProps> = ({
  value = '',
  compact = false,
  ...props
}) => {
  const [input, setInput] = useState<string>();
  const [validType, setValidType] = useState<'FEN' | 'PGN' | null>();

  useDebouncedEffect(
    () => {
      if (!input) {
        setValidType(undefined);
        return;
      }

      const validType = isValidFenOrPGN(input || '');

      setValidType(validType.ok ? validType.val : null);
    },
    250,
    [input],
  );

  if (compact) {
    return (
      <DragAndDrop
        fileTypes={['PGN', 'FEN', 'TXT']}
        className={`border-dashed border rounded-md border-slate-400 text-gray-300 ${props.containerClassName}`}
        onUpload={(f: any) => {
          // TODO: Validate PGN

          const fileData = new FileReader();
          fileData.onloadend = (s) => {
            if (s.target && typeof s.target.result === 'string') {
              const input = s.target.result;

              if (!input) {
                return;
              }

              if (ChessFENBoard.validateFenString(input).ok) {
                props.onChange({ type: 'FEN', val: input });
              } else if (isValidPgn(input)) {
                props.onChange({ type: 'PGN', val: input });
              }
            }
          };
          fileData.readAsText(f);
        }}
      >
        <div className="sborder p-2 sborder-dashed rounded-md cursor-pointer">
          Upload or Drop a PGN or FEN File
        </div>
      </DragAndDrop>
    );
  }

  return (
    <div className={`flex flex-col flex-1 gap-3 ${props.containerClassName}`}>
      <div className={`mb-0 flex-1 flex flex-col ${props.contentClassName}`}>
        <TextArea
          value={input}
          containerClassName={`flex-1 rounded-lg p-1 ${
            input && validType === null ? 'border border-red-400' : ''
          }`}
          rows={5}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste or Drag & Drop PGN or FEN here"
          hasValidationError={!!validType}
        />
        <DragAndDrop
          fileTypes={['PGN', 'FEN', 'TXT']}
          className="mt-2 sp-2 border-dashed border rounded-md border-slate-600 text-gray-300"
          onUpload={(f: any) => {
            // TODO: Validate PGN

            const fileData = new FileReader();
            fileData.onloadend = (s) => {
              if (s.target && typeof s.target.result === 'string') {
                setInput(s.target.result);
              }
            };
            fileData.readAsText(f);
          }}
        >
          <div className="border p-2 border-dashed rounded-md cursor-pointer">
            Upload or Drop a PGN or FEN File
          </div>
        </DragAndDrop>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          // disabled={!input}
          disabled={!validType}
          size="sm"
          onClick={() => {
            if (!input) {
              return;
            }

            if (ChessFENBoard .validateFenString(input).ok) {
              props.onChange({ type: 'FEN', val: input });
            } else if (isValidPgn(input)) {
              props.onChange({ type: 'PGN', val: input });
            }
          }}
        >
          Import {validType}
        </Button>
        <Button
          type="clear"
          size="sm"
          onClick={() => {
            setInput('');
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
};

const isValidFenOrPGN = (input: string): Result<'FEN' | 'PGN', void> => {
  if (!input) {
    return Err.EMPTY;
  }

  if (ChessFENBoard.validateFenString(input).ok) {
    return new Ok('FEN');
  } else if (isValidPgn(input)) {
    return new Ok('PGN');
  }

  return Err.EMPTY;
};
