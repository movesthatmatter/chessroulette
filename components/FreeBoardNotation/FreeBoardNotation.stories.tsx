import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { FreeBoardNotation } from './FreeBoardNotation';
import { useState } from 'react';
import {
  FBHHistory,
  FBHIndex,
  FreeBoardHistory as FBH,
} from '@/lib/FreeBoardHistory';

const meta: Meta<typeof FreeBoardNotation> = {
  component: FreeBoardNotation,
  title: 'FreeBoardNotation',
};

export default meta;
type Story = StoryObj<typeof FreeBoardNotation>;

const BASIC_HISTORY = FBH.pgnToHistory(
  '1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Nc3 Qc7 6. Bd3 Nc6 7. h3'
);

export const LinearHistory: Story = {
  render: () => (
    <div style={{ width: '400px' }}>
      <FreeBoardNotation
        history={BASIC_HISTORY}
        onDelete={action('OnDelete')}
        onRefocus={action('OnRefocus')}
        focusedIndex={[0, 1]}
      />
    </div>
  ),
};

const historyWithOneGenBranch = [
  ...BASIC_HISTORY.slice(0, 1),
  [
    {
      ...BASIC_HISTORY[1][0],
      branchedHistories: [
        [
          [
            {
              isNonMove: true,
              san: '...',
              color: 'w',
            },
            {
              from: 'd7',
              to: 'd6',
              san: 'd6',
              color: 'b',
            },
          ],
        ] as FBHHistory,
      ],
    },
    {
      ...BASIC_HISTORY[1][1],
    },
  ],
  ...BASIC_HISTORY.slice(2, 4),
  [
    BASIC_HISTORY[4][0],
    {
      ...BASIC_HISTORY[4][1],
      branchedHistories: [
        FBH.pgnToHistory('1. e3 c5 2. Nf3 e6 3. d4 d6'),
        FBH.pgnToHistory('1. e4 c5 2. Nf3 e5 3. d3'),
      ],
    },
  ],
  ...BASIC_HISTORY.slice(5),
] as FBHHistory;

export const NestedHistory: Story = {
  render: () => {
    const [currentIndex, setCurrentIndex] = useState<FBHIndex>([0, 1]);

    return (
      <>
        <div className="p-2 border border-slate-600" style={{ width: '400px' }}>
          <FreeBoardNotation
            history={historyWithOneGenBranch}
            onDelete={(p) => {
              console.log('on delete', p);

              action('OnDelete')(p);
            }}
            onRefocus={(p) => {
              console.log('on focus', FBH.renderIndex(p));

              setCurrentIndex(p);
              action('OnRefocus')(p);
            }}
            focusedIndex={currentIndex}
          />
        </div>
        {FBH.renderIndex(currentIndex)}
        {/* {currentIndex.join(' ')} */}
      </>
    );
  },
};

const bugMultipleFocusesHistory: FBHHistory = [
  [
    {
      color: 'w',
      // piece: 'p',
      san: 'e3',
      to: 'e3',
      from: 'e2',
      branchedHistories: [
        [
          [
            {
              color: 'w',
              san: '...',
              isNonMove: true,
            },
            {
              color: 'b',
              // piece: 'p',
              san: 'c6',
              to: 'c6',
              from: 'c7',
            },
          ],
        ],
      ],
    },
    {
      color: 'b',
      // piece: 'p',
      san: 'e6',
      to: 'e6',
      from: 'e7',
      branchedHistories: [
        [
          [
            {
              color: 'w',
              // piece: 'p',
              san: 'd3',
              to: 'd3',
              from: 'd2',
            },
            {
              color: 'b',
              // piece: 'p',
              san: 'f6',
              to: 'f6',
              from: 'f7',
            },
          ],
          [
            {
              color: 'w',
              // piece: 'p',
              san: 'f3',
              to: 'f3',
              from: 'f2',
            },
          ],
        ],
        [
          [
            {
              color: 'w',
              // piece: 'p',
              san: 'c3',
              to: 'c3',
              from: 'c2',
            },
            {
              color: 'b',
              // piece: 'p',
              san: 'd5',
              to: 'd5',
              from: 'd7',
            },
          ],
          [
            {
              color: 'w',
              // piece: 'p',
              san: 'd4',
              to: 'd4',
              from: 'd2',
            },
          ],
        ],
      ],
    },
  ],
  [
    {
      color: 'w',
      // piece: 'p',
      san: 'f4',
      to: 'f4',
      from: 'f2',
    },
  ],
];

export const BugMultipleFocuses: Story = {
  render: () => {
    const [currentIndex, setCurrentIndex] = useState<FBHIndex>([0, 1]);

    return (
      <>
        <div className="text-gray-500">
          Note! To see this working press on "c6"
        </div>
        <div className="p-2 border border-slate-600" style={{ width: '400px' }}>
          <FreeBoardNotation
            history={bugMultipleFocusesHistory}
            onDelete={(p) => {
              console.log('on delete', p);

              action('OnDelete')(p);
            }}
            onRefocus={(p) => {
              console.log('on focus', FBH.renderIndex(p));

              setCurrentIndex(p);
              action('OnRefocus')(p);
            }}
            focusedIndex={currentIndex}
          />
        </div>
        {FBH.renderIndex(currentIndex)}
        {/* {currentIndex.join(' ')} */}
      </>
    );
  },
};
