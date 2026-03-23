import React, { useState, useEffect } from 'react';
import { Sidebar, Navbar, Pagination } from '../components/layout';
import { projectApi, stageApi, taskApi } from '../api';
import { Badge, SearchBar, DataTable } from '../components/ui';
import { usePagination, useDebounce } from '../hooks';

function ProjectsPage() {
  const { page, limit, changePage, changeLimit } = usePagination();
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const debouncedKeyword = useDebounce(searchKeyword, 300);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit,
          keyword: debouncedKeyword || undefined,
          status: statusFilter || undefined,
        };
        
        const response = await projectApi.getList(params);
        setProjects(response.data?.list || []);
        setTotal(response.data?.pagination?.total || 0);
      } catch (error) {
        console.error('获取项目列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [page, limit, debouncedKeyword, statusFilter]);

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (text, record) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{text}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{record.description}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (text) => <Badge status={text} />,
    },
    {
      title: '当前阶段',
      dataIndex: 'current_stage',
      render: (text) => text || '无',
    },
    {
      title: '进度',
      dataIndex: 'progress',
      render: (text) => (
        <div className="flex items-center">
          <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${text}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">{text}%</span>
        </div>
      ),
    },
    {
      title: '任务数',
      dataIndex: 'task_count',
      render: (text, record) => `${record.completed_task_count}/${text}`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar title="项目管理" />
      <div className="p-6">
        {/* 筛选条件 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-xs">
              <SearchBar
                placeholder="搜索项目名称..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="w-48">
              <select
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">所有状态</option>
                <option value="draft">草稿</option>
                <option value="active">进行中</option>
                <option value="completed">已完成</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>
        </div>

        {/* 项目列表 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={projects} />
            
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={changePage}
              onLimitChange={changeLimit}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ProjectsPage;
