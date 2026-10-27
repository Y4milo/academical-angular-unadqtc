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
    academic: {
      semesters: {
        path: `academic/semesters`,
        link: `admin/academic/semesters`,
      },
    },
    users: {
      accounts: {
        path: `users/accounts`,
        link: `admin/users/accounts`,
        sheetPath: `users/accounts/:id`,
      },
      cases: {
        path: `users/cases`,
        link: `admin/users/cases`,
      },
    },
    dbu: {
      config: {
        path: `dbu/config`,
        link: `admin/dbu/config`,
      },
      queue: {
        path: `dbu/cola`,
        link: `admin/dbu/cola`,
      },
    },
    serviceOrders: {
      path: `service-orders`,
      link: `admin/service-orders`,
      newOrder: {
        path: `service-orders/nueva`,
        link: `admin/service-orders/nueva`,
      },
      config: {
        path: `service-orders/config`,
        link: `admin/service-orders/config`,
      },
      detailPath: `service-orders/:id`,
    },
    components: {
      path: `components`,
      link: `admin/components`,
    },
    accounting: {
      bank: {
        incidents: {
          path: `accounting/bank/incidents`,
          link: `admin/accounting/bank/incidents`,
        },
        config: {
          path: `accounting/bank/config`,
          link: `admin/accounting/bank/config`,
        },
        traces: {
          path: `accounting/bank/traces`,
          link: `admin/accounting/bank/traces`,
        },
        files: {
          path: `accounting/bank/files`,
          link: `admin/accounting/bank/files`,
        },
      },
    },
    degreesTitles: {
      generalData: {
        path: `degrees-titles/general-data`,
        link: `admin/degrees-titles/general-data`,
      },
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
    generalData: {
      path: `general-data`,
      link: `degrees-titles/general-data`,
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
        register: {
          path:  `staff/attendance/register`,
          link:   `hr/staff/attendance/register`,
        },
        manual: {
          path:  `staff/attendance/manual`,
          link:   `hr/staff/attendance/manual`,
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
  dbu: {
    path: `dbu`,
    // Páginas públicas del alumno (sin cuenta): reservar y consultar o cancelar una cita.
    booking: {
      path:  `citas`,
      link:   `dbu/citas`,
    },
    status: {
      path:  `citas/estado`,
      link:   `dbu/citas/estado`,
    },
    queue: {
      path:  `cola`,
      link:   `dbu/cola`,
    },
    config: {
      path:  `config`,
      link:   `dbu/config`,
    },
    home: {
      path:  `cola`,
      link:   `dbu/cola`,
    },
  },
  accounting: {
    path: `accounting`,
    bank: {
      incidents: {
        path:  `bank/incidents`,
        link:   `accounting/bank/incidents`,
      },
      traces: {
        path:  `bank/traces`,
        link:   `accounting/bank/traces`,
      },
      files: {
        path:  `bank/files`,
        link:   `accounting/bank/files`,
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
    semesters: {
      path:  `semesters`,
      link:   `academic/semesters`,
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
  }
}
