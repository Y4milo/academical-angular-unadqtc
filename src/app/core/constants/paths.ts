export const paths = {
  origin: location.origin,
  login: {
    staff:    `login-admin`,
    student:  `login-student`,
  },
  hr: {
    path: `hr`,
    staff: {
      attendance: {
        home: {
          route:  `staff/home`,
          link:   `hr/staff/home`,
        },
        list: {
          route:  `staff/attendance`,
          link:   `hr/staff/attendance`,
        },
        reports: {
          route:  `staff/reports`,
          link:   `hr/staff/reports`,
        },
      },
    },
  },
  student: {
    card: {
      registration: `student/card/registration`,
    },
  },
  staff: {
    user:  `staff/attendance/user`,
  },
  accounting: {
    payments: `accounting/student/payments`,
  },
  academic: {
    student: {
      card: {
        panel : `academic/student/card/panel`,
      }
    }
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
