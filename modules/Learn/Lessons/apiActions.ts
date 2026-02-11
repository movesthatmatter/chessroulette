'use server';

import prisma from '../../../services/prisma';
import { LessonCreateInput, LessonModel } from './types';

export const findUserLessons = async (props: {
  userId: string;
  query?: {
    tag?: string;
  };
}) =>
  prisma.lesson.findMany({
    where: {
      userId: props.userId,
      ...(props.query?.tag && {
        tags: {
          some: {
            name: {
              contains: props.query.tag,
            },
          },
        },
      }),
    },
    include: {
      tags: {
        select: {
          name: true,
        },
      },
      chapters: {
        select: { id: true, name: true, startingFen: true },
      },
    },
  }) as unknown as LessonModel[];

export const findLesson = async (props: {
  lessonId: string;
  query?: {
    tag?: string;
  };
}) =>
  prisma.lesson.findUnique({
    where: {
      id: props.lessonId,
      ...(props.query?.tag && {
        tags: {
          some: {
            name: {
              contains: props.query.tag,
            },
          },
        },
      }),
    },
    include: {
      tags: {
        select: {
          name: true,
        },
      },
      chapters: {
        select: { id: true, name: true, startingFen: true },
      },
    },
  }) as unknown as LessonModel;

export const createLesson = async ({
  userId,
  input,
}: {
  userId: string;
  input: LessonCreateInput;
}) => {
  console.log('going to create the lesson for', userId, input);

  // return prisma.lesson.create({
  //   data: {
  //     name: input.name,
  //     createdBy: { connect: { id: userId } },
  //     chapters: { create: input.chapters },
  //   },
  // });
};

// export const testForm = async (...args: any) => {
//   console.log('test form', ...args);
// };

// export const createLessonWithUserId =
//   async (userId: string) => async (input: LessonCreateInput) =>
//     createLesson({ userId, input });
