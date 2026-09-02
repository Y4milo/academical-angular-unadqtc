export const PATHS = {
  origin: location.origin,
  login: {
    staff:    `login-admin`,
    student:  `login-student`,
  },
  admin: {
    path: `admin`,
    home: {
      path:  `home`,
      link:   `admin/home`,
    },
    events: {
      certificates: {
        path: `events/certificates`,
        link: `admin/events/certificates`,
      },
    },
    accounting: {
      bank: {
        incidents: {
          path: `accounting/bank/incidents`,
          link: `admin/accounting/bank/incidents`,
        },
      },
    },
    degreesTitles: {
      calls: {
        path: `degrees-titles/calls`,
        link: `admin/degrees-titles/calls`,
      },
      records: {
        path: `degrees-titles/records`,
        link: `admin/degrees-titles/records`,
      },
      exports: {
        path: `degrees-titles/exports`,
        link: `admin/degrees-titles/exports`,
      },
    },
    support: {
      requests: {path: `support/requests`, link: `admin/support/requests`},
    },
  },
  degreesTitles: {
    path: `degrees-titles`,
    home: {
      path: `calls`,
      link: `degrees-titles/calls`,
    },
    calls: {
      path: `calls`,
      link: `degrees-titles/calls`,
    },
    records: {
      path: `records`,
      link: `degrees-titles/records`,
    },
    exports: {
      path: `exports`,
      link: `degrees-titles/exports`,
    },
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
    bank: {
      incidents: {
        path:  `bank/incidents`,
        link:   `accounting/bank/incidents`,
      },
    },
    payments: `accounting/student/payments`,
    home: {
      path:  `bank/incidents`,
      link:   `accounting/bank/incidents`,
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
      },
      approvedAverage: {
        path:  `student/approved-average`,
        link:   `academic/student/approved-average`,
      }
    },
  },
  event: {
    path: `event`,
    participant: {
      register: `participant/register/:slug`,
    },
    attendance: {
      path: `attendance`,
      check_in: `check-in/:slug/:id`,
      check_out: `check-out/:slug/:id`,
    },
    certification: {
      download: `certification/download`,
      validate: `certification/validate/:slug`,
    }
  }
}
