import { PaginationProps } from 'antd';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

export interface PaginationHandlers {
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/**
 * 创建标准的分页配置
 * @param state 分页状态
 * @param handlers 分页处理函数
 * @param total 总数据量
 * @param pageSizeOptions 页面大小选项
 * @returns 分页配置对象
 */
export const createPaginationConfig = (
  state: PaginationState,
  handlers: PaginationHandlers,
  total: number,
  pageSizeOptions: string[] = ['10', '20', '50', '100']
): PaginationProps => {
  const { currentPage, pageSize } = state;
  const { setCurrentPage, setPageSize } = handlers;

  return {
    current: currentPage,
    pageSize: pageSize,
    total: total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
    pageSizeOptions: pageSizeOptions,
    onChange: (page, size) => {
      setCurrentPage(page);
      if (size !== pageSize) {
        setPageSize(size);
        setCurrentPage(1); // 重置到第一页
      }
    },
    onShowSizeChange: (current, size) => {
      setPageSize(size);
      setCurrentPage(1); // 重置到第一页
    },
  };
};

/**
 * 创建简单的分页配置（用于不需要复杂功能的页面）
 * @param state 分页状态
 * @param handlers 分页处理函数
 * @param total 总数据量
 * @returns 分页配置对象
 */
export const createSimplePaginationConfig = (
  state: PaginationState,
  handlers: PaginationHandlers,
  total: number
): PaginationProps => {
  return createPaginationConfig(state, handlers, total, ['10', '20', '50']);
};

/**
 * 创建试卷分页配置（8条/页的选项）
 * @param state 分页状态
 * @param handlers 分页处理函数
 * @param total 总数据量
 * @returns 分页配置对象
 */
export const createPaperPaginationConfig = (
  state: PaginationState,
  handlers: PaginationHandlers,
  total: number
): PaginationProps => {
  return createPaginationConfig(state, handlers, total, ['8', '16', '24', '32']);
};









