import { Home, Users, Settings, FileText, BarChart3, Mail, LucideIcon, UserCog, UserPlus, PieChart, TrendingUp, Bell, Inbox } from 'lucide-react';

export interface NavItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// 在这里配置侧边栏导航菜单（支持树状结构）
export const navigationConfig: NavGroup[] = [
  {
    label: '主要功能',
    items: [
      { title: '首页', url: '/dashboard', icon: Home },
      { 
        title: '用户管理', 
        icon: Users,
        children: [
          { title: '用户列表', url: '/dashboard/users', icon: UserCog },
          { title: '添加用户', url: '/dashboard/users/add', icon: UserPlus },
        ]
      },
      { 
        title: '数据报表', 
        icon: BarChart3,
        children: [
          { title: '概览', url: '/dashboard/reports', icon: PieChart },
          { title: '趋势分析', url: '/dashboard/reports/trends', icon: TrendingUp },
        ]
      },
    ],
  },
  {
    label: '其他',
    items: [
      { title: '文档', url: '/dashboard/docs', icon: FileText },
      { 
        title: '消息', 
        icon: Mail,
        children: [
          { title: '收件箱', url: '/dashboard/messages', icon: Inbox },
          { title: '通知', url: '/dashboard/messages/notifications', icon: Bell },
        ]
      },
      { title: '设置', url: '/dashboard/settings', icon: Settings },
    ],
  },
];
