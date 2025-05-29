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

const CustomTableB150 = ({ data, formatTime }) => {
  // ฟังก์ชันตรวจสอบว่าเป็นแถวแรกของรอบการผลิตหรือไม่
  const isFirstRowForRun = (index, data) => {
    return index === 0 || data[index].run_no !== data[index - 1].run_no;
  };

  // ฟังก์ชันคำนวณจำนวนแถวที่จะ rowspan
  const calculateRowSpan = (data, index) => {
    const currentRunNo = data[index].run_no;
    return data.filter((p) => p.run_no === currentRunNo).length;
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
            <TableCell>Solid Block</TableCell>
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
            <TableCell className="remove-work">Remove Work</TableCell>
            <TableCell>Block</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((plan, index) => {
            const isFirst = isFirstRowForRun(index, data);
            const rowSpan = isFirst ? calculateRowSpan(data, index) : 1;

            return (
                <TableRow >
                  {isFirst && (
                    <TableCell rowSpan={rowSpan}>{plan.run_no}</TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan}>{plan.machine}</TableCell>
                  )}
                  <TableCell>{plan.batch_no}</TableCell>
                  {isFirst && (
                    <TableCell rowSpan={rowSpan}>{plan.program}</TableCell>
                  )}
                  <TableCell className="start-time">{formatTime(plan.start_time)}</TableCell>
                  <TableCell>{formatTime(plan.mixing)}</TableCell>
                  <TableCell>{formatTime(plan.solid_block)}</TableCell>
                  <TableCell>{formatTime(plan.extruder_exit)}</TableCell>
                  {isFirst && (
                    <TableCell rowSpan={rowSpan}>
                      {formatTime(plan.pre_press_exit)}
                    </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan} className="primary-press">
                      {formatTime(plan.primary_press_start)}
                    </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan} className="stream-in">
                    {formatTime(plan.stream_in)}
                  </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan}>
                      {formatTime(plan.primary_press_exit)}
                    </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan} className="secondary-press">
                      {formatTime(plan.secondary_press_1_start)}
                    </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan} className="temp-check-row">
                      {formatTime(plan.temp_check_1)}
                    </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan} className="secondary-press">
                      {formatTime(plan.secondary_press_2_start)}
                    </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan} className="temp-check-row">
                      {formatTime(plan.temp_check_2)}
                    </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan}>
                      {formatTime(plan.cooling)}
                    </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan}>
                      {formatTime(plan.secondary_press_exit)}
                    </TableCell>
                  )}
                  {isFirst && (
                    <TableCell rowSpan={rowSpan} className="remove-work">
                      {formatTime(plan.remove_work)}
                    </TableCell>
                  )}
                  <TableCell>{plan.foam_block}</TableCell>
                </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomTableB150;
