export const API_STUDENT_CARDS = {

    //-------------------------------------------
    // ACADEMIC
    //-------------------------------------------
    ACADEMIC: {

      DOWNLOAD: {
        STUDENT: {
          FILE_BY_TYPE: (studentCardId: number, type: StudentFileType) =>
            `/student-cards/academic/download/student/${studentCardId}/file/${type}`,
          FILE:{
            PHOTO: '/student-cards/academic/download/student/photo',
            ZIP: '/student-cards/academic/download/student/zip',
            PDF: '/student-cards/academic/download/student/pdf',
            XLSX: '/student-cards/academic/download/student/xlsx',
          }
        }
      },

      UPDATE: {
        STUDENT: {
          BASIC_INFO: '/student-cards/academic/update/student/basic-info',
          FILE: {
            BY_TYPE: (type: StudentFileType) =>
              `/student-cards/academic/update/student/file/${type}`,
            PHOTO : '/student-cards/academic/update/student/file/photo'
          }
        }
      },

      SET: {
        STUDENT: {
          ENSURE_PENDING: '/student-cards/academic/set/student/ensure-pending',
          VALIDATE: '/student-cards/academic/set/student/validate',
          PENDING: '/student-cards/academic/set/student/pending',
          FLAGS: '/student-cards/academic/set/student/flags',
          FILE_STATUS: '/student-cards/academic/set/student/file-status',
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
