import React, { useState, useEffect } from 'react';
import { Sidebar, Navbar } from '../components/layout';
import { Pagination } from '../components/layout';
import { agentApi } from '../api';
import { Badge, SearchBar, DataTable } from '../components/ui';
import { usePagination, useDebounce } from '../hooks';

function AgentsPage() {
  const { page, limit, changePage, changeLimit } = usePagination();
  const [agents, setAgents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

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
        
        // 获取分类列表
        if (response.data?.list?.length > 0) {
          const allCategories = new Set();
          response.data.list.forEach(agent => {
            if (agent.category) allCategories.add(agent.category);
          });
          setCategories(Array.from(allCategories));
        }
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
                <option value="">所有分类</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
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
