import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Typography,
  Collapse,
  DatePicker,
  InputNumber,
  Tooltip,
  ConfigProvider
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Panel } = Collapse;

export interface SearchFilterConfig {
  // 搜索配置
  searchPlaceholder?: string;
  searchFields?: string[];
  
  // 筛选配置
  filters?: {
    key: string;
    label: string;
    type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange';
    options?: { label: string; value: any }[];
    placeholder?: string;
  }[];
  
  // 高级筛选
  showAdvanced?: boolean;
  advancedFilters?: {
    key: string;
    label: string;
    type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange';
    options?: { label: string; value: any }[];
    placeholder?: string;
  }[];
}

export interface SearchFilterValue {
  search?: string;
  filters?: { [key: string]: any };
  advancedFilters?: { [key: string]: any };
}

interface SearchFilterProps {
  config: SearchFilterConfig;
  value?: SearchFilterValue;
  onChange?: (value: SearchFilterValue) => void;
  onSearch?: (value: SearchFilterValue) => void;
  onReset?: () => void;
  loading?: boolean;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  config,
  value = {},
  onChange,
  onSearch,
  onReset,
  loading = false
}) => {
  const [searchValue, setSearchValue] = useState(value.search || '');
  const [filters, setFilters] = useState(value.filters || {});
  const [advancedFilters, setAdvancedFilters] = useState(value.advancedFilters || {});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 设置dayjs为中文
  useEffect(() => {
    dayjs.locale('zh-cn');
  }, []);

  useEffect(() => {
    setSearchValue(value.search || '');
    setFilters(value.filters || {});
    setAdvancedFilters(value.advancedFilters || {});
  }, [value]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    const newValue = { search: value, filters, advancedFilters };
    onChange?.(newValue);
  };

  const handleFilterChange = (key: string, filterValue: any) => {
    const newFilters = { ...filters, [key]: filterValue };
    setFilters(newFilters);
    const newValue = { search: searchValue, filters: newFilters, advancedFilters };
    onChange?.(newValue);
  };

  const handleAdvancedFilterChange = (key: string, filterValue: any) => {
    const newAdvancedFilters = { ...advancedFilters, [key]: filterValue };
    setAdvancedFilters(newAdvancedFilters);
    const newValue = { search: searchValue, filters, advancedFilters: newAdvancedFilters };
    onChange?.(newValue);
  };

  const handleSearch = () => {
    const searchValueData = { search: searchValue, filters, advancedFilters };
    onSearch?.(searchValueData);
  };

  const handleReset = () => {
    setSearchValue('');
    setFilters({});
    setAdvancedFilters({});
    const resetValue = { search: '', filters: {}, advancedFilters: {} };
    onChange?.(resetValue);
    onReset?.();
  };

  const renderFilter = (filter: any, value: any, onChange: (key: string, value: any) => void) => {
    const { key, label, type, options, placeholder } = filter;

    switch (type) {
      case 'select':
        return (
          <Select
            key={key}
            placeholder={placeholder || `请选择${label}`}
            value={value}
            onChange={(val) => onChange(key, val)}
            style={{ width: '100%' }}
            allowClear
          >
            {options?.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case 'multiselect':
        return (
          <Select
            key={key}
            mode="multiple"
            placeholder={placeholder || `请选择${label}`}
            value={value}
            onChange={(val) => onChange(key, val)}
            style={{ width: '100%' }}
            allowClear
          >
            {options?.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case 'date':
        return (
          <DatePicker
            key={key}
            placeholder={placeholder || `请选择${label}`}
            value={value}
            onChange={(val) => onChange(key, val)}
            style={{ width: '100%' }}
            locale={zhCN.DatePicker}
          />
        );

      case 'daterange':
        return (
          <RangePicker
            key={key}
            placeholder={[`开始${label}`, `结束${label}`]}
            value={value}
            onChange={(val) => onChange(key, val)}
            style={{ width: '100%' }}
            locale={zhCN.DatePicker}
          />
        );

      case 'number':
        return (
          <InputNumber
            key={key}
            placeholder={placeholder || `请输入${label}`}
            value={value}
            onChange={(val) => onChange(key, val)}
            style={{ width: '100%' }}
          />
        );

      case 'numberrange':
        return (
          <InputNumber.Group
            key={key}
            compact
            style={{ width: '100%' }}
          >
            <InputNumber
              placeholder="最小值"
              value={value?.[0]}
              onChange={(val) => onChange(key, [val, value?.[1]])}
              style={{ width: '50%' }}
            />
            <InputNumber
              placeholder="最大值"
              value={value?.[1]}
              onChange={(val) => onChange(key, [value?.[0], val])}
              style={{ width: '50%' }}
            />
          </InputNumber.Group>
        );

      default:
        return null;
    }
  };

  const getActiveFilterCount = () => {
    const filterCount = Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length;
    return filterCount;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      {/* 基础搜索和筛选 */}
      <Row gutter={16} align="middle">
        {/* 搜索框 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder={config.searchPlaceholder || '搜索...'}
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>

        {/* 基础筛选器 */}
        {config.filters?.map((filter, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={filter.key}>
            {renderFilter(filter, filters[filter.key], handleFilterChange)}
          </Col>
        ))}

        {/* 操作按钮 */}
        <Col xs={24} sm={24} md={24} lg={6}>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
            >
              搜索
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
          </Space>
        </Col>
      </Row>


      {/* 当前筛选条件显示 */}
      {activeFilterCount > 0 && (
        <div style={{ marginTop: 16, padding: '8px 12px', background: '#f0f9ff', borderRadius: 6 }}>
          <Space wrap>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              当前筛选条件:
            </Text>
            {Object.entries(filters).map(([key, value]) => {
              if (value === undefined || value === null || value === '') return null;
              const filter = config.filters?.find(f => f.key === key);
              return (
                <Tag
                  key={key}
                  closable
                  onClose={() => handleFilterChange(key, undefined)}
                  color="blue"
                >
                  {filter?.label}: {Array.isArray(value) ? value.join(', ') : value}
                </Tag>
              );
            })}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default SearchFilter;

