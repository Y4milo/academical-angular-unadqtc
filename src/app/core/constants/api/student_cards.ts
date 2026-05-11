export const API_STUDENT_CARDS = {

    //-------------------------------------------
    // ACADEMIC
    //-------------------------------------------
    ACADEMIC: {

      DOWNLOAD: {
        STUDENT: {
          FILE:{
            PHOTO: 'student-cards/academic/download/student/photo',
            ZIP: 'student-cards/academic/download/student/zip',
            PDF: 'student-cards/academic/download/student/pdf',
            XLSX: 'student-cards/academic/download/student/xslx',
          }
        }
      },

      UPDATE: {
        STUDENT: {
          FILE: {
            PHOTO : '/student-cards/academic/update/student/file/photo'
          }
        }
      },

      SET: {
        STUDENT: {
          VALIDATE: {
            FILE: (type: string) => `/student-cards/academic/update/student/file/${type}`
          }
        }
      },

      LIST: {
        PENDING: '/student-cards/academic/list/student/pending',
        UNMATCHED: '/student-cards/academic/list/student/unmatched',
        VALIDATED: '/student-cards/academic/list/student/validated',
        FLAGGED: '/student-cards/academic/list/student/flagged',
      }
    },

    //-------------------------------------------
    // STUDENT
    //-------------------------------------------
    STUDENT: {

      STORE: {
        FILE: {
          PHOTO: '/student-cards/student/store/file/photo',
          DNI: '/student-cards/student/store/file/dni',
        }
      },

      DOWNLOAD: {
        FILE: (type: StudentFileType) =>
          `/student-cards/student/download/file/${type}`
      }
    }

};

export type StudentFileType = 'photo' | 'dni';
