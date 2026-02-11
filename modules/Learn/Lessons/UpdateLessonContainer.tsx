'use client';

import { LessonEditorView } from './LessonEditor/LessonEditorView';
import { useLearnRoutes_WITH_UNSAFE_SESSOIN_IN_URL } from './hooks/useLearnRoutes_WITH_UNSAFE_SESSOIN_IN_URL';
import { LessonModel } from './types';
import {
  lessonModelToLessonState,
  lessonStateToLessonCreateInput,
} from './util';

type Props = {
  lesson: LessonModel;
};

export const UpdateLessonContainer = ({ lesson }: Props) => {
  const lessonState = lessonModelToLessonState(lesson);

  const x = useLearnRoutes_WITH_UNSAFE_SESSOIN_IN_URL()

  console.log('UpdateLessonContainer', x);

  return (
    <LessonEditorView
      state={lessonState}
      onCommit={(draft) => {
        console.log(
          'committing draft state',
          draft,
          'to input',
          lessonStateToLessonCreateInput(draft)
        );
      }}
    />
  );
};
