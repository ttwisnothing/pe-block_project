import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './listplan.css'
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ListPlan = () => {
  const [planTimes, setPlanTimes] = useState([])
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null)
  const navigate = useNavigate();

  // สร้าง object สำหรับเก็บ mapping ของสีต่างๆ
  const colorMap = {
    'wh': { name: 'White', color: '#FFFFFF', border: '#CCCCCC' },
    'gy': { name: 'Gray', color: '#ADADAD', border: '#888888' },
    'db': { name: 'Dark Black', color: '#222222', border: '#000000' },
    'lg': { name: 'Light Gray', color: '#D3D3D3', border: '#AAAAAA' },
    'bk': { name: 'Black', color: '#000000', border: '#333333' },
    'nc': { name: 'No Color', color: 'transparent', border: '#CCCCCC' },
    // เพิ่มสีอื่นๆ ตามต้องการ
  };

  // ฟังก์ชันสำหรับดึงรหัสสีจากชื่อโปรดักส์หรือชื่อสี
  const getColorCode = (productName, colorName) => {
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

  useEffect(() => {
    const fetchPlanTimes = async () => {
      try {
        const res = await axios.get('/api/get/list-plantime')
        
        // ประมวลผลสถานะตามเวลา
        const processedData = res.data.map(plan => {
          let status = 'pending';
          const now = new Date();
          const startTime = plan.startTime ? new Date(`${new Date().toDateString()} ${plan.startTime}`) : null;
          const endTime = plan.endTime ? new Date(`${new Date().toDateString()} ${plan.endTime}`) : null;
          
          if (startTime && endTime) {
            if (now < startTime) {
              status = 'pending'; // รอผลิต
            } else if (now >= startTime && now < endTime) {
              status = 'in-progress'; // กำลังผลิต
            } else if (now >= endTime) {
              status = 'completed'; // เสร็จสิ้น
            }
          }
          
          return { ...plan, status };
        });
        
        setPlanTimes(processedData);
      } catch (error) {
        console.error("Error fetching plan times:", error);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPlanTimes();
    
    // ปรับปรุงสถานะทุก 1 นาที
    const statusInterval = setInterval(() => {
      fetchPlanTimes();
    }, 60000);
    
    return () => clearInterval(statusInterval);
  }, []);

  const handleShowPlanTimeDetail = async (productName, colorName) => {
    setLoading(true);
    try {
      // ขอข้อมูลแผนเวลาจาก API
      const response = await axios.get(`/api/get/plantime/${productName}`);
      
      if (!response.data || !response.data.planTimes || response.data.planTimes.length === 0) {
        toast.info("ℹ️ ไม่มีข้อมูล Plan Time สำหรับ Product นี้");
        return;
      }
      
      // เก็บข้อมูลใน localStorage เพื่อส่งไปหน้าแสดงรายละเอียด
      localStorage.setItem(
        "planTimeData",
        JSON.stringify({
          productName,
          colorName,
          planTimes: response.data.planTimes,
        })
      );
      
      // เปิดหน้าใหม่เพื่อแสดงแผนเวลา
      window.open("/plantime-table", "_blank");
    } catch (error) {
      console.error("❌ ERROR fetching Plan Time:", error);
      toast.error(error.response?.data?.message || "❌ ไม่สามารถดึงข้อมูลแผนเวลาได้");
    } finally {
      setLoading(false);
    }
  };

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
    </div>
  )

  return (
    <div className="container-listplan">
      <ToastContainer position="top-right" />
      <div className="header-section">
        <h2>รายการ Plan Time ของโปรดักส์</h2>
        <div className="total-count">
          รวม {planTimes.length} รายการ
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
            {planTimes.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  <div className="no-data-content">
                    <span>📋</span>
                    <p>ไม่พบข้อมูล Plan Time</p>
                  </div>
                </td>
              </tr>
            ) : (
              planTimes.map((plan, idx) => {
                // คำนวณรหัสสีจากชื่อโปรดักส์หรือชื่อสี
                const colorCode = getColorCode(plan.product_name, plan.color_name);
                
                return (
                  <tr key={plan.product_id} className="data-row">
                    <td className="index-cell">{idx + 1}</td>
                    <td className="product-cell">
                      <div className="product-info">
                        <span className="product-name">{plan.product_name}</span>
                        {plan.color_name && (
                          <span className="color-tag">
                            <span 
                              className="color-indicator" 
                              style={getColorStyle(colorCode)}
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
                        {plan.status === 'completed' ? 'เสร็จสิ้น' : 
                         plan.status === 'in-progress' ? 'กำลังผลิต' : 
                         plan.status === 'pending' ? 'รอผลิต' : 'ไม่ระบุ'}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button className='btn-show' onClick={() => handleShowPlanTimeDetail(plan.product_name, plan.color_name, plan.product_id)} disabled={loading}>
                        {loading ? (
                          <>
                            <span className="loading-spinner"></span>
                            กำลังโหลด...
                          </>
                        ) : (
                          <>
                            <span>📋</span>
                            แสดงแผนเวลา
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ListPlan
