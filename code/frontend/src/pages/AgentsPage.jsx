import React, { useState, useEffect } from 'react';
import { Sidebar, Navbar } from '../components/layout.jsx';
import { Pagination } from '../components/layout.jsx';
import { agentApi } from '../api/index.jsx';
import { Badge, SearchBar, DataTable } from '../components/ui.jsx';
import { usePagination, useDebounce } from '../hooks/index.jsx';

// 预定义的中文分类列表（基于 agency-agents-zh 的 17 个部门）
const CATEGORY_OPTIONS = [
  { value: '', label: '所有分类' },
  { value: '工程部', label: '工程部' },
  { value: '设计部', label: '设计部' },
  { value: '营销部', label: '营销部' },
  { value: '付费媒体部', label: '付费媒体部' },
  { value: '销售部', label: '销售部' },
  { value: '财务部', label: '财务部' },
  { value: '人力资源部', label: '人力资源部' },
  { value: '法务部', label: '法务部' },
  { value: '供应链部', label: '供应链部' },
  { value: '产品部', label: '产品部' },
  { value: '项目管理部', label: '项目管理部' },
  { value: '测试部', label: '测试部' },
  { value: '支持部', label: '支持部' },
  { value: '专业部', label: '专业部' },
  { value: '空间计算部', label: '空间计算部' },
  { value: '游戏开发部', label: '游戏开发部' },
  { value: '学术部', label: '学术部' },
];

function AgentsPage() {
  const { page, limit, changePage, changeLimit } = usePagination();
  const [agents, setAgents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const debouncedKeyword = useDebounce(searchKeyword, 300);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit,
          keyword: debouncedKeyword || undefined,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        };
        
        const response = await agentApi.getList(params);
        setAgents(response.data?.list || []);
        setTotal(response.data?.pagination?.total || 0);
      } catch (error) {
        console.error('获取智能体列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [page, limit, debouncedKeyword, statusFilter, categoryFilter]);

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
      title: '分类',
      dataIndex: 'category',
      render: (text) => <Badge status={text?.replace('agent_', '') || 'idle'} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (text) => <Badge status={text} />,
    },
    {
      title: '当前任务',
      dataIndex: 'current_task_id',
      render: (text) => text || '无',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar title="智能体管理" />
      <div className="p-6">
        {/* 筛选条件 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-xs">
              <SearchBar
                placeholder="搜索智能体名称或描述..."
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
                <option value="idle">空闲</option>
                <option value="running">运行中</option>
                <option value="error">错误</option>
                <option value="offline">离线</option>
              </select>
            </div>
            <div className="w-48">
              <select
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 智能体列表 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={agents} />
            
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

export default AgentsPage;
