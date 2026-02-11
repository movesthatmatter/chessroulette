'use client';

import { useRef } from 'react';
import { useSessionUserOrSetAsGuest, useUser } from '../../User';
import { LessonEditorView } from './LessonEditor/LessonEditorView';
import { initialLessonState } from './LessonEditor/draftLessonReducer';
import { createLesson } from './apiActions';
import { LessonCreateInput, LessonModel } from './types';
import {
  lessonModelToLessonState,
  lessonStateToLessonCreateInput,
} from './util';

type Props = {
  userId: string;
  onSubmit: (props: { userId: string; input: LessonCreateInput }) => void;
};

export const CreateLessonContainer = ({ userId, onSubmit }: Props) => {
  // const lessonState = initialLessonState;
  // const user = useUser();
  const user = useSessionUserOrSetAsGuest();

  // const formRef = useRef<HTMLFormElement>(null);

  // console.log('form ref', formRef);

  return (
    <form className="flex-1 w-full h-full flex">
      <LessonEditorView
        state={initialLessonState}
        onCommit={(draft) => {
          const input = lessonStateToLessonCreateInput(draft);
          // console.log('committing draft state', draft, 'to input', input);

          onSubmit({ userId, input });

          // console.log(formRef.current);
        }}
      />
    </form>
  );
};
