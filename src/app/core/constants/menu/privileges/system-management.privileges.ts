const SystemManagementPrivileges = [
  {
    label: 'Entities',
    icon: 'home',
    items: [
      {
        label: 'List Entities',
        routerLink: '/campus'
      },
      {
        label: 'Status',
        routerLink: '/campus'
      },
    ]
  },
  {
    label: 'People $ Roles & Accounts',
    icon: 'user',
    items: [
      {
        label: 'User Role',
        routerLink: '/campus'
      },
      {
        label: 'People',
        routerLink: '/campus'
      },
      {
        label: 'Accounts',
        routerLink: '/campus'
      },
    ]
  },
];

export default SystemManagementPrivileges;
