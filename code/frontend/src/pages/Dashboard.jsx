import React, { useState, useEffect } from 'react';
import { Sidebar, Navbar, StatCard } from '../components/layout.jsx';
import { agentApi, projectApi } from '../api/index.jsx';
import { Badge } from '../components/ui.jsx';

function Dashboard() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [agents, setAgents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取智能体统计
        const agentResponse = await agentApi.getList({ limit: 1 });
        const projectResponse = await projectApi.getList({ limit: 1 });

        setStats({
          totalAgents: agentResponse.data?.pagination?.total || 0,
          activeAgents: 0, // 需要实际计算
          totalProjects: projectResponse.data?.pagination?.total || 0,
          activeProjects: 0, // 需要实际计算
          totalTasks: 0,
          completedTasks: 0,
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar title="仪表盘" />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                title="智能体总数"
                value={stats.totalAgents}
                subtitle="注册的智能体数量"
              />
              <StatCard
                title="智能体状态"
                value={stats.activeAgents}
                subtitle="当前活跃的智能体"
                trend="+12%"
                trendUp={true}
              />
              <StatCard
                title="项目总数"
                value={stats.totalProjects}
                subtitle="正在进行和已完成的项目"
              />
              <StatCard
                title="任务完成率"
                value={stats.completedTasks > 0 ? `${((stats.completedTasks / (stats.totalTasks || 1)) * 100).toFixed(1)}%` : '0%'}
                subtitle="总任务完成情况"
              />
            </div>

            {/* 最近项目 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">最近项目</h3>
              <div className="space-y-3">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge status={project.status} />
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-300">进度</span>
                            <span className="text-gray-600 dark:text-gray-300">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    暂无项目数据
                  </div>
                )}
              </div>
            </div>

            {/* 最近智能体 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">最近智能体</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.length > 0 ? (
                  agents.map((agent) => (
                    <div key={agent.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{agent.name}</h4>
                        <Badge status={agent.status} />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{agent.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {agent.categories?.map((category) => (
                          <span key={category} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    暂无智能体数据
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
