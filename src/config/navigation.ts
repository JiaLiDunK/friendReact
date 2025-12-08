import { Home, Users, FileText, BarChart3, PersonStanding, LucideIcon, UserCog, UserPlus, PieChart, TrendingUp, Bell, Inbox ,File ,FileChartColumn,Database,Book,BookOpen } from 'lucide-react';

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
        title: '系统基础的配置', 
        icon: BarChart3,
        children: [
          { title: '类型管理', url: '/dashboard/type-management', icon: PieChart },
          { title: '角色提示词管理', url: '/dashboard/prompt-management', icon: PersonStanding },
        ]
      },
    ],
  },
  {
    label: '其他',
    items: [
      { title: '文档',
        icon: FileText,
        children:[
          {title:'查看切割资料',url:'/dashboard/document-management',icon:File},
          {title:'查看切割准备向量的书籍',url:'/dashboard/type-management',icon:FileChartColumn}
        ]
       },
      { 
        title: '知识库', 
        icon: Database,
        children: [
          { title: '查看知识库', url: '/dashboard/messages', icon: Book  },
          { title: '知识库内容', url: '/dashboard/messages/notifications', icon: BookOpen },
        ]
      },
    ],
  },
];
