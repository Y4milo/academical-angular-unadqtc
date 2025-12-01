export const PATHS = {
  origin: location.origin,
  login: {
    staff:    `login-admin`,
    student:  `login-student`,
  },
  hr: {
    path: `hr`,
    home: {
      path:  `home`,
      link:   `hr/home`,
    },
    staff: {
      path: `staff`,
      attendance: {
        list: {
          path:  `staff/attendance`,
          link:   `hr/staff/attendance`,
        },
        reports: {
          path:  `staff/reports`,
          link:   `hr/staff/reports`,
        },
      },
    },
  },
  student: {
    path: `student`,
    card: {
      registration: `student/card/registration`,
    },
    home: {
      path:  `home`,
      link:   `student/card/registration`,
    },
  },
  professor: {
    path: `professor`,
    home: {
      path:  `home`,
      link:   `staff/home`,
      // link:   `staff/attendance/user`,
    },
  },
  administrative: {
    path: `administrative`,
    home: {
      path:  `home`,
      link:   `staff/home`,
      // link:   `staff/attendance/user`,
    },
  },
  staff: {
    path: `staff`,
    home: {
      path:  `home`,
      link:   `staff/home`,
      // link:   `staff/attendance/user`,
    },
  },
  accounting: {
    path: `accounting`,
    payments: `accounting/student/payments`,
    home: {
      path:  `home`,
      link:   `accounting/student/payments`,
    },
  },
  academic: {
    path: `academic`,
    home: {
      path:  `home`,
      link:   `academic/home`,
    },
    student: {
      card: {
        panel : {
          path:  `student/card/panel`,
          link:   `academic/student/card/panel`,
        },
      },
      ranking: {
        path:  `student/ranking`,
        link:   `academic/student/ranking`,
      }
    },
  },
  event: {
    participant: {
      register: `event/participant/register/:slug`,
    },
    attendance: {
      check_in: `event/attendance/check-in/:slug/:id`,
      check_out: `event/attendance/check-out/:slug/:id`,
    }
  }
}
