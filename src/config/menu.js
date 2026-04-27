export const ROLE = {
  ENTERPRISE: 'enterprise',
  AUDITOR: 'auditor',
  ADMIN: 'admin',
}

export const ROLE_LABEL = {
  [ROLE.ENTERPRISE]: '企业用户',
  [ROLE.AUDITOR]: '审核员',
  [ROLE.ADMIN]: '管理员/监管',
}

export const ROLE_HOME = {
  [ROLE.ENTERPRISE]: '/enterprise/carbon/upload',
  [ROLE.AUDITOR]: '/auditor/audit/list',
  [ROLE.ADMIN]: '/admin/system/users',
}

export const MENU_BY_ROLE = {
  [ROLE.ENTERPRISE]: [
    {
      label: '企业用户',
      children: [
        {
          label: '碳核算',
          children: [{ label: '上传审核', path: '/enterprise/carbon/upload' }],
        },
        {
          label: 'P2P订单管理',
          children: [{ label: '订单管理', path: '/enterprise/p2p/orders' }],
        },
        {
          label: '碳交易',
          children: [
            { label: '双向拍卖', path: '/enterprise/trading/market' },
          ],
        },
        {
          label: '本公司信息',
          children: [
            { label: '我的账户', path: '/enterprise/account/center' },
            { label: '数据可视化', path: '/enterprise/company/dashboard' },
          ],
        },
      ],
    },
  ],
  [ROLE.AUDITOR]: [
    {
      label: '审核员',
      children: [
        {
          label: '审核材料',
          children: [
            { label: '审核列表', path: '/auditor/audit/list' },
          ],
        },
      ],
    },
  ],
  [ROLE.ADMIN]: [
    {
      label: '管理员/监管',
      children: [
        {
          label: '系统管理',
          children: [
            { label: '用户管理', path: '/admin/system/users' },
            { label: '碳核算管理', path: '/admin/system/carbon' },
            { label: '系统配置', path: '/admin/system/config' },
          ],
        },
        {
          label: '数据管理',
          children: [{ label: '统计数据', path: '/admin/data/statistics' }],
        },
      ],
    },
  ],
}
