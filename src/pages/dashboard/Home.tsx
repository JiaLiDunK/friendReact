import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, BarChart3, TrendingUp } from 'lucide-react';

const stats = [
  { title: '用户总数', value: '2,543', icon: Users, change: '+12%' },
  { title: '文档数量', value: '156', icon: FileText, change: '+5%' },
  { title: '本月访问', value: '12,456', icon: BarChart3, change: '+23%' },
  { title: '转化率', value: '3.2%', icon: TrendingUp, change: '+0.5%' },
];

const Home = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">概览</h2>
        <p className="text-muted-foreground">欢迎回来，这是您的数据概览</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-primary">{stat.change} 较上月</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>快速开始</CardTitle>
          <CardDescription>从这里开始构建你的应用</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>这是一个简洁的管理后台模板，你可以：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>在 <code className="bg-muted px-1 rounded">src/config/navigation.ts</code> 中配置侧边栏导航</li>
            <li>在 <code className="bg-muted px-1 rounded">src/pages/dashboard/</code> 中添加新页面</li>
            <li>在 <code className="bg-muted px-1 rounded">src/contexts/AuthContext.tsx</code> 中接入真实的认证逻辑</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
