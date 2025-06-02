import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow, 
  Paper,
} from "@mui/material";
import "./table.css";
 
const CustomTable = ({ data, formatTime, }) => {
  // ฟังก์ชันตรวจสอบว่าเป็นแถวแรกของรอบการผลิตหรือไม่
  const isFirstRowForRun = (index, data) => {
    return index === 0 || data[index].run_no !== data[index - 1].run_no;
  };

  // ฟังก์ชันคำนวณจำนวนแถวที่จะ rowspan
  const calculateRowSpan = (data, index) => {
    const currentRunNo = data[index].run_no;
    return data.filter(p => p.run_no === currentRunNo).length;
  };

  return (
    <TableContainer component={Paper} className="custom-table-container">
      <Table className="custom-table" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Run No</TableCell>
            <TableCell>เครื่อง</TableCell>
            <TableCell>Batch No</TableCell>
            <TableCell>Program</TableCell>
            <TableCell>เริ่มเดินงาน</TableCell>
            <TableCell>เวลาผสมเสร็จ</TableCell>
            <TableCell>ออกจาก เอ็กซ์ทรูดเดอร์</TableCell>
            <TableCell>ออกจาก พรีเพลส</TableCell>
            <TableCell>เริ่มอบที่ไพรมารี่ เพลส</TableCell>
            <TableCell>กด สตรีมอิน</TableCell>
            <TableCell>ออกจากไพรมารี่ เพลส</TableCell>
            <TableCell className="secondary-press">เริ่มอบรอบที่ 1 เซคคันดารี่ เพลส</TableCell>
            <TableCell className="temp-check">จดอุณหภูมิรอบที่ 1</TableCell>
            <TableCell className="secondary-press">เริ่มอบรอบที่ 2 เซคคันดารี่ เพลส</TableCell>
            <TableCell className="temp-check">จดอุณหภูมิรอบที่ 2</TableCell>
            <TableCell>คูลลิ่ง</TableCell>
            <TableCell>ออกจาก เซคคันดารี่ เพลส</TableCell>
            <TableCell>Block</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((plan, index) => {
            const isFirst = isFirstRowForRun(index, data);
            const rowSpan = isFirst ? calculateRowSpan(data, index) : 1;

            return (
              <React.Fragment key={index}>
                {index === data.length - 1 && (
                  <TableRow>
                    <TableCell colSpan={18} className="adj-stop-row">
                      กด ADJ STOP
                    </TableCell>
                  </TableRow>
                )}

                <TableRow>
                  {isFirst && (
                    <TableCell rowSpan={rowSpan}>
                      {plan.run_no}
                    </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan}>
                      {plan.machine}
                    </TableCell>
                  )}
                  <TableCell>{plan.batch_no}</TableCell>
                  <TableCell>{plan.program}</TableCell>
                  {!plan.start_time && !plan.mixing && !plan.extruder_exit ? (
                    <TableCell colSpan={3} className="missing-time">
                    </TableCell>
                  ) : (
                    <>
                      <TableCell
                        className={`start-time ${!plan.start_time ? "missing-time" : ""}`}
                      >
                        {formatTime(plan.start_time) || ""}
                      </TableCell>
                      <TableCell className={!plan.mixing ? "missing-time" : ""}>
                        {formatTime(plan.mixing) || ""}
                      </TableCell>
                      <TableCell
                        className={!plan.extruder_exit ? "missing-time" : ""}
                      >
                        {formatTime(plan.extruder_exit) || ""}
                      </TableCell>
                    </>
                  )}
                  {isFirst && (
                    <>
                      <TableCell rowSpan={rowSpan}>
                        {formatTime(plan.pre_press_exit)}
                      </TableCell>
                      <TableCell rowSpan={rowSpan}>
                        {formatTime(plan.primary_press_start)}
                      </TableCell>
                      <TableCell rowSpan={rowSpan} className="stream-in">
                        {formatTime(plan.stream_in)}
                      </TableCell>
                      <TableCell rowSpan={rowSpan}>
                        {formatTime(plan.primary_press_exit)}
                      </TableCell>
                      <TableCell rowSpan={rowSpan} className="secondary-press-start">
                        {formatTime(plan.secondary_press_1_start)}
                      </TableCell>
                      <TableCell rowSpan={rowSpan} className="temp-check-row">
                        {formatTime(plan.temp_check_1)}
                      </TableCell>
                      <TableCell rowSpan={rowSpan} className="secondary-press-start">
                        {formatTime(plan.secondary_press_2_start)}
                      </TableCell>
                      <TableCell rowSpan={rowSpan} className="temp-check-row">
                        {formatTime(plan.temp_check_2)}
                      </TableCell>
                      <TableCell rowSpan={rowSpan}>
                        {formatTime(plan.cooling)}
                      </TableCell>
                      <TableCell rowSpan={rowSpan}>
                        {formatTime(plan.secondary_press_exit)}
                      </TableCell>
                    </>
                  )}
                  <TableCell>{plan.foam_block}</TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomTable;
