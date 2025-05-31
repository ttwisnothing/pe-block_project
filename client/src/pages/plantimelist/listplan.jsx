import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import './listplan.css'
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ListPlan = () => {
  const [planTimes, setPlanTimes] = useState([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('create_date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate();

  // สร้าง object สำหรับเก็บ mapping ของสีต่างๆ
  const colorMap = {
    'wh': { name: 'White', color: '#FFFFFF', border: '#CCCCCC' },
    'gy': { name: 'Gray', color: '#ADADAD', border: '#888888' },
    'db': { name: 'Dark Black', color: '#222222', border: '#000000' },
    'lg': { name: 'Light Gray', color: '#D3D3D3', border: '#AAAAAA' },
    'bk': { name: 'Black', color: '#000000', border: '#333333' },
    'nc': { name: 'No Color', color: 'transparent', border: '#CCCCCC' },
  };

  // ฟังก์ชันสำหรับดึงรหัสสีจากชื่อโปรดักส์หรือชื่อสี
  const getColorCode = (productName, colorName) => {
    if (!colorName && !productName) return 'nc';
    
    // ถ้ามี colorName ที่ตรงกับรหัสสีเลย เช่น 'WH', 'LG', 'BK'
    const directMatch = Object.keys(colorMap).find(
      code => colorName && colorName.toLowerCase().includes(code.toLowerCase())
    );
    
    if (directMatch) return directMatch;
    
    // ถ้าไม่มี ลองหาจาก pattern ของชื่อโปรดักส์ เช่น "RP-300S WH"
    if (productName) {
      const parts = productName.split(' ');
      const lastPart = parts[parts.length - 1]?.toLowerCase();
      
      if (lastPart && Object.keys(colorMap).includes(lastPart)) {
        return lastPart;
      }
    }
    
    // ถ้าชื่อสีไม่เป็นรหัส แต่เป็นชื่อเต็ม เช่น "White", "Black"
    if (colorName) {
      for (const [code, details] of Object.entries(colorMap)) {
        if (colorName.toLowerCase().includes(details.name.toLowerCase())) {
          return code;
        }
      }
    }
    
    return 'nc'; // default to no color
  };

  // ฟังก์ชันสำหรับดึง style ของสี
  const getColorStyle = (colorCode) => {
    const code = colorCode ? colorCode.toLowerCase() : 'nc';
    const colorInfo = colorMap[code] || { color: 'transparent', border: '#CCCCCC', name: 'Unknown' };
    
    return {
      backgroundColor: colorInfo.color,
      borderColor: colorInfo.border,
      color: ['wh', 'lg', 'nc'].includes(code) ? '#333333' : '#FFFFFF',
    };
  };

  // ฟังก์ชันสำหรับคำนวณสถานะ
  const calculateStatus = (startTime, endTime) => {
    if (!startTime || !endTime) return 'pending';
    
    const now = new Date();
    const today = new Date().toDateString();
    
    // แปลง time string เป็น Date object สำหรับวันนี้
    const start = new Date(`${today} ${startTime}`);
    const end = new Date(`${today} ${endTime}`);
    
    if (now < start) {
      return 'pending'; // รอผลิต
    } else if (now >= start && now < end) {
      return 'in-progress'; // กำลังผลิต
    } else if (now >= end) {
      return 'completed'; // เสร็จสิ้น
    }
    
    return 'pending';
  };

  // Filter และ Sort ข้อมูล
  const filteredAndSortedPlans = useMemo(() => {
    let filtered = planTimes.filter(plan => {
      const matchesSearch = !searchTerm || 
        plan.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.color_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'create_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [planTimes, searchTerm, statusFilter, sortBy, sortOrder]);

  // ฟังก์ชันดึงข้อมูล
  const fetchPlanTimes = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/get/list-plantime');
      console.log('API Response:', response.data);
      
      if (!Array.isArray(response.data)) {
        throw new Error('Response data is not an array');
      }
      
      // ประมวลผลสถานะตามเวลา
      const processedData = response.data.map(plan => ({
        ...plan,
        status: calculateStatus(plan.startTime, plan.endTime)
      }));
      
      setPlanTimes(processedData);
      
      if (showToast) {
        toast.success('ข้อมูลถูกอัพเดทแล้ว');
      }
      
    } catch (error) {
      console.error("Error fetching plan times:", error);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (error.response?.data?.message || error.message));
      if (!showToast) {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlanTimes();
    
    // ปรับปรุงสถานะทุก 1 นาที
    const statusInterval = setInterval(() => {
      setPlanTimes(prevPlans => 
        prevPlans.map(plan => ({
          ...plan,
          status: calculateStatus(plan.startTime, plan.endTime)
        }))
      );
    }, 60000);
    
    return () => clearInterval(statusInterval);
  }, []);

  const handleShowPlanTimeDetail = async (productName, colorName) => {
    try {
      const response = await axios.get(`/api/get/plantime/${productName}`);
      
      if (!response.data || !response.data.planTimes || response.data.planTimes.length === 0) {
        toast.info("ℹ️ ไม่มีข้อมูล Plan Time สำหรับ Product นี้");
        return;
      }
      
      localStorage.setItem(
        "planTimeData",
        JSON.stringify({
          productName,
          colorName,
          planTimes: response.data.planTimes,
        })
      );
      
      window.open("/plantime-table", "_blank");
    } catch (error) {
      console.error("❌ ERROR fetching Plan Time:", error);
      toast.error(error.response?.data?.message || "❌ ไม่สามารถดึงข้อมูลแผนเวลาได้");
    }
  };

  // จำนวนข้อมูลตาม status
  const statusCounts = useMemo(() => {
    return planTimes.reduce((acc, plan) => {
      acc[plan.status] = (acc[plan.status] || 0) + 1;
      return acc;
    }, {});
  }, [planTimes]);

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>กำลังโหลดข้อมูล...</p>
    </div>
  )
   
  if (error) return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p>{error}</p>
      <button onClick={() => fetchPlanTimes()}>ลองใหม่</button>
    </div>
  )

  return (
    <div className="container-listplan">
      <div className="header-section">
        <h2>รายการ Plan Time ของโปรดักส์</h2>
        <div className="status-summary">
          <div className="status-card">
            <span className="status-count">{statusCounts.pending || 0}</span>
            <span className="status-label">รอผลิต</span>
          </div>
          <div className="status-card">
            <span className="status-count">{statusCounts['in-progress'] || 0}</span>
            <span className="status-label">กำลังผลิต</span>
          </div>
          <div className="status-card">
            <span className="status-count">{statusCounts.completed || 0}</span>
            <span className="status-label">เสร็จสิ้น</span>
          </div>
          <div className="status-card total">
            <span className="status-count">{planTimes.length}</span>
            <span className="status-label">รวมทั้งหมด</span>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="ค้นหาชื่อโปรดักส์หรือสี..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอผลิต</option>
              <option value="in-progress">กำลังผลิต</option>
              <option value="completed">เสร็จสิ้น</option>
            </select>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="sort-select"
            >
              <option value="create_date-desc">วันที่สร้างล่าสุด</option>
              <option value="create_date-asc">วันที่สร้างเก่าสุด</option>
              <option value="product_name-asc">ชื่อโปรดักส์ A-Z</option>
              <option value="product_name-desc">ชื่อโปรดักส์ Z-A</option>
            </select>
          </div>
        </div>
        
        <div className="action-controls">
          <button 
            className="refresh-btn"
            onClick={() => fetchPlanTimes(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <span className="loading-spinner small"></span>
                กำลังอัพเดท...
              </>
            ) : (
              <>
                🔄 รีเฟรช
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="table-wrapper">
        <table className='table-listplan'>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>ชื่อโปรดักส์ (สี)</th>
              <th>เริ่มผลิต</th>
              <th>สิ้นสุด</th>
              <th>สถานะ</th>
              <th>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPlans.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  <div className="no-data-content">
                    <span>📋</span>
                    <p>
                      {searchTerm || statusFilter !== 'all' 
                        ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' 
                        : 'ไม่พบข้อมูล Plan Time'
                      }
                    </p>
                    {(searchTerm || statusFilter !== 'all') && (
                      <button 
                        className="clear-filters-btn"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                        }}
                      >
                        ล้างตัวกรอง
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedPlans.map((plan, idx) => {
                const colorCode = getColorCode(plan.product_name, plan.color_name);
                
                return (
                  <tr key={`${plan.product_id}-${idx}`} className="data-row">
                    <td className="index-cell">{idx + 1}</td>
                    <td className="product-cell">
                      <div className="product-info">
                        <span className="product-name">{plan.product_name}</span>
                        {plan.color_name && (
                          <span className="color-tag">
                            <span 
                              className="color-indicator" 
                              style={getColorStyle(colorCode)}
                              title={`Color: ${plan.color_name}`}
                            >
                            </span>
                            {plan.color_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="time-cell">
                      {plan.startTime ? (
                        <span className="time-value">{plan.startTime}</span>
                      ) : (
                        <span className="no-time">-</span>
                      )}
                    </td>
                    <td className="time-cell">
                      {plan.endTime ? (
                        <span className="time-value">{plan.endTime}</span>
                      ) : (
                        <span className="no-time">-</span>
                      )}
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge ${plan.status || 'pending'}`}>
                        {plan.status === 'completed' ? '✅ เสร็จสิ้น' : 
                         plan.status === 'in-progress' ? '🔄 กำลังผลิต' : 
                         plan.status === 'pending' ? '⏳ รอผลิต' : '❓ ไม่ระบุ'}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button 
                        className='btn-show' 
                        onClick={() => handleShowPlanTimeDetail(plan.product_name, plan.color_name)} 
                        title="แสดงแผนเวลาผลิตแบบละเอียด"
                      >
                        <span>📋</span>
                        แสดงแผนเวลา
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <div className="results-info">
        แสดง {filteredAndSortedPlans.length} จาก {planTimes.length} รายการ
        {(searchTerm || statusFilter !== 'all') && (
          <span className="filter-indicator">
            (มีการกรองข้อมูล)
          </span>
        )}
      </div>
    </div>
  )
}

export default ListPlan
