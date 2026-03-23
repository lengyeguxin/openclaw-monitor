import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar, Navbar } from '../components/layout';
import { Pagination } from '../components/layout';
import { projectApi, stageApi, taskApi } from '../api';
import { Badge, DataTable } from '../components/ui';
import { usePagination } from '../hooks';

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { page, limit, changePage, changeLimit } = usePagination();
  
  const [project, setProject] = useState(null);
  const [stages, setStages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取项目详情
        const projectResponse = await projectApi.getById(id);
        setProject(projectResponse.data);

        // 获取阶段列表
        const stageResponse = await stageApi.getList(id);
        setStages(stageResponse.data?.list || []);

        // 获取任务列表（如果选定了阶段）
        if (activeStage || stageResponse.data?.list?.[0]?.id) {
          const stageId = activeStage || stageResponse.data.list[0].id;
          const taskResponse = await taskApi.getList({
            stage_id: stageId,
            page,
            limit,
          });
          setTasks(taskResponse.data?.list || []);
          setTotalTasks(taskResponse.data?.pagination?.total || 0);
        }
      } catch (error) {
        console.error('获取项目详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, activeStage, page, limit]);

  const handleStageChange = async (stageId) => {
    setActiveStage(stageId);
    try {
      const taskResponse = await taskApi.getList({
        stage_id: stageId,
        page: 1,
        limit,
      });
      setTasks(taskResponse.data?.list || []);
      setTotalTasks(taskResponse.data?.pagination?.total || 1);
      changePage(1);
    } catch (error) {
      console.error('获取任务列表失败:', error);
    }
  };

  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      render: (text, record) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {text}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (text) => <Badge status={text} />,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      render: (text) => <Badge status={text} />,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      render: (text) => `${text}%`,
    },
    {
      title: '预计工时',
      dataIndex: 'estimated_hours',
      render: (text) => `${text} 小时`, // 来自 API 字段
    },
    {
      title: '分配智能体',
      dataIndex: 'assigned_agents',
      render: (agents) => 
        agents?.map((agent, index) => (
          <span key={agent.id} className="mr-2">
            {agent.name}
          </span>
        )) || '未分配',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return <div>项目不存在</div>;
  }

  return (
    <div className="min-h-screen">
      <Navbar title={`项目详情 - ${project.name}`} />
      <div className="p-6">
        {/* 项目概览 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">{project.description}</p>
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">状态：</span>
                  <Badge status={project.status} />
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">进度：</span>
                  <span className="font-medium text-gray-900 dark:text-white">{project.progress}%</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">当前阶段：</span>
                  <span className="font-medium text-gray-900 dark:text-white">{project.current_stage}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              返回列表
            </button>
          </div>

          {/* 进度条 */}
          <div className="mt-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">项目进度</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 阶段切换 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">阶段</h3>
          <div className="flex overflow-x-auto space-x-2 pb-2">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => handleStageChange(stage.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeStage === stage.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {stage.name}
              </button>
            ))}
          </div>
        </div>

        {/* 任务列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              任务列表 ({totalTasks})
            </h3>
          </div>

          <DataTable columns={taskColumns} data={tasks} />

          <Pagination
            page={page}
            total={totalTasks}
            limit={limit}
            onPageChange={changePage}
            onLimitChange={changeLimit}
          />
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
