import React from 'react';

// 粒子故事组件
export function ParticleStory({ children }) {
  return (
    <div className="particle-story">
      {children}
    </div>
  );
}

ParticleStory.Title = function ParticleStoryTitle({ children }) {
  return <div className="particle-story-title">{children}</div>;
};

ParticleStory.Particle = function ParticleStoryParticle({ name, description }) {
  return (
    <div className="particle-story-particle">
      <h3>{name}</h3>
      <p>{description}</p>
    </div>
  );
};

// 表格组件
export function DataTable({ columns, data, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 分页组件
export function Pagination({ page, total, limit, onPageChange, onLimitChange }) {
  const totalPages = Math.ceil(total / limit);
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6">
      <div className="flex items-center">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          显示 {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} 共 {total} 条
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
          className="ml-3 block w-16 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="10">10 条/页</option>
          <option value="20">20 条/页</option>
          <option value="50">50 条/页</option>
          <option value="100">100 条/页</option>
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange && onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          上一页
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          第 {page} / {totalPages} 页
        </span>
        <button
          onClick={() => onPageChange && onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          下一页
        </button>
      </div>
    </div>
  );
}

// 搜索框组件
export function SearchBar({ placeholder, onSearch, onChange, value }) {
  return (
    <div className="relative rounded-md shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

// 状态徽章组件
export function Badge({ status }) {
  const statusConfig = {
    idle: { bg: 'bg-blue-100', text: 'text-blue-800', label: '空闲' },
    running: { bg: 'bg-green-100', text: 'text-green-800', label: '运行中' },
    error: { bg: 'bg-red-100', text: 'text-red-800', label: '错误' },
    offline: { bg: 'bg-gray-100', text: 'text-gray-800', label: '离线' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '待处理' },
    active: { bg: 'bg-blue-100', text: 'text-blue-800', label: '进行中' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', label: '已完成' },
    draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: '草稿' },
    archived: { bg: 'bg-gray-200', text: 'text-gray-600', label: '已归档' },
    high: { bg: 'bg-red-100', text: 'text-red-800', label: '高' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '中' },
    low: { bg: 'bg-green-100', text: 'text-green-800', label: '低' },
    urgent: { bg: 'bg-purple-100', text: 'text-purple-800', label: '紧急' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
