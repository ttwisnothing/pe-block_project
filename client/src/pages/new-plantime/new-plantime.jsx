import React, { useEffect, useState } from "react";
import axios from "axios";
import "./new-plantime.css";

function formatThaiDate(date) {
  const days = [
    "อาทิตย์",
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
  ];
  const months = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const day = days[date.getDay()];
  const d = date.getDate();
  const m = months[date.getMonth()];
  const y = date.getFullYear() + 543;
  return `${day}\n${d} ${m} ${y}`;
}

function formatTime(date) {
  return date.toLocaleTimeString("th-TH", { hour12: false });
}

const plantimeId = "PTID20250627RP_300SWH_2";

const NewPlantime = () => {
  const [now, setNow] = useState(new Date());
  const [planData, setPlanData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productDisplay, setProductDisplay] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/get/test-new-plantime/${plantimeId}`)
      .then((res) => {
        setPlanData(res.data.planTimes || []);
        setProductDisplay(res.data.planTimes?.[0]?.productDisplay || "");
      })
      .catch(() => {
        setPlanData([]);
        setProductDisplay("");
      })
      .finally(() => setLoading(false));
  }, []);

  const processNameMap = {
    start_time: "กดปุ่มเริ่มต้น",
    mixing: "ผสม",
    solid_block: "ก้อนแข็ง",
    extruder_exit: "ออกจาก Extruder",
    mold_primary_press: "ขึ้นแม่พิมพ์",
    pre_press_exit: "ออกจาก Pre-Press",
    primary_press_start: "เริ่มต้น Primary Press",
    stream_in: "อบไอน้ำ",
    primary_press_exit: "ออกจาก Primary Press",
    secondary_press_1_start: "เริ่มต้น Secondary Press 1",
    temp_check_1: "ตรวจอุณหภูมิ 1",
    secondary_press_2_start: "เริ่มต้น Secondary Press 2",
    temp_check_2: "ตรวจอุณหภูมิ 2",
    cooling: "ทำความเย็น",
    trolley_in: "เข้า Trolley",
    trolley_out: "ออกจาก Trolley",
    secondary_press_exit: "ออกจาก Secondary Press",
    remove_work: "นำงานออก",
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-in-progress';
      case 'pending': return 'status-pending';
      default: return 'status-default';
    }
  };

  return (
    <div className="new-plantime-container">
      {/* Header Section */}
      <header className="new-plantime-header">
        <div className="header-left">
          <div className="new-plantime-logo" />
          <div className="header-titles">
            <h1 className="new-plantime-title-th">
              สถานะการผลิต {productDisplay}
            </h1>
            <p className="new-plantime-title-en">
              Production Status for {productDisplay}
            </p>
          </div>
        </div>
        <div className="header-right">
          <div className="new-plantime-datetime">
            <div className="new-plantime-date" style={{ whiteSpace: "pre-line" }}>
              {formatThaiDate(now)}
            </div>
            <div className="new-plantime-time">{formatTime(now)}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="new-plantime-content">
        <div className="new-plantime-table-container">
          <div className="new-plantime-table">
            <div className="new-plantime-table-header">
              <div className="header-cell">เวลา</div>
              <div className="header-cell">โปรแกรม</div>
              <div className="header-cell">กระบวนการผลิต</div>
              <div className="header-cell">เครื่องจักร</div>
              <div className="header-cell">Batch</div>
              <div className="header-cell">Run</div>
              <div className="header-cell">สถานะ</div>
            </div>
            
            <div className="new-plantime-table-body">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>กำลังโหลดข้อมูล...</p>
                </div>
              ) : planData.length === 0 ? (
                <div className="empty-state">
                  <p>ไม่พบข้อมูลการผลิต</p>
                </div>
              ) : (
                planData.map((item, idx) => (
                  <div className="new-plantime-table-row" key={idx}>
                    <div className="table-cell time-cell">
                      {item.processTime || "--:--"}
                    </div>
                    <div className="table-cell program-cell">
                      <span className="program-code">-</span>
                    </div>
                    <div className="table-cell process-cell">
                      <span className="process-name">
                        {processNameMap[item.processName] || item.processName || "ไม่ระบุ"}
                      </span>
                    </div>
                    <div className="table-cell machine-cell">
                      {item.machine || "ไม่ระบุ"}
                    </div>
                    <div className="table-cell batch-cell">
                      {item.batch_no ? (
                        <span className="batch-number">Batch {item.batch_no}</span>
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </div>
                    <div className="table-cell run-cell">
                      {item.run_no ? (
                        <span className="run-number">Run {item.run_no}</span>
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </div>
                    <div className="table-cell status-cell">
                      <span className={`status-badge ${getStatusClass(item.status)}`}>
                        {item.status === 'completed' ? 'เสร็จสิ้น' : 
                         item.status === 'in-progress' ? 'กำลังดำเนินการ' : 
                         item.status === 'pending' ? 'รอดำเนินการ' : 'รอข้อมูล'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewPlantime;
