import {PATHS} from './paths';

export const home_link = {
  administrative:   PATHS.administrative.home.link,
  professor:        PATHS.professor.home.link,
  student:          PATHS.student.home.link,
  accounting:       PATHS.accounting.home.link,
  academic:         PATHS.academic.home.link,
  hr:               PATHS.hr.home.link,
}as const;

export type HomeKey = keyof typeof home_link;
