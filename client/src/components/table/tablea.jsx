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

const CustomeTableA110F = ({ data, formatTime }) => {
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
            <TableCell>Solid Block ก้อนแรก</TableCell>
            <TableCell>ออกจาก เอ็กซ์ทรูดเดอร์</TableCell>
            <TableCell>สเปรย์ Mold ไพรมารี่เพลส</TableCell>
            <TableCell className="secondary-press-start">
              ออกจาก Pre-Press
            </TableCell>
            <TableCell>เริ่มอบ Primary Press</TableCell>
            <TableCell className="temp-check-row">
              ออกจาก Primary Press
            </TableCell>
            <TableCell className="temp-check-row">เอางานใส่รถเข็น</TableCell>
            <TableCell>เอางานลงจากรถเข็น</TableCell>
            <TableCell>วัดขนาดบล็อคโฟม</TableCell>
            <TableCell>Block</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((plan, idx) => (
              <TableRow key={idx}>
                <TableCell>{plan.run_no}</TableCell>
                <TableCell>{plan.machine}</TableCell>
                <TableCell>{plan.batch_no}</TableCell>
                <TableCell>{plan.program_no}</TableCell>
                <TableCell className="start-time">
                  {formatTime(plan.start_time)}
                </TableCell>
                <TableCell>{formatTime(plan.mixing)}</TableCell>
                <TableCell>{formatTime(plan.solid_block)}</TableCell>
                <TableCell>{formatTime(plan.extruder_exit)}</TableCell>
                <TableCell>{formatTime(plan.mold_primary_press)}</TableCell>
                <TableCell className="secondary-press-start">
                  {formatTime(plan.pre_press_exit)}
                </TableCell>
                <TableCell className="stream-in">
                  {formatTime(plan.primary_press_start)}
                </TableCell>
                <TableCell className="temp-check-row">
                  {formatTime(plan.primary_press_exit)}
                </TableCell>
                <TableCell className="temp-check-row">
                  {formatTime(plan.trolley_in)}
                </TableCell>
                <TableCell>{formatTime(plan.trolley_out)}</TableCell>
                <TableCell>{formatTime(plan.remove_work)}</TableCell>
                <TableCell>{plan.block}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={15} align="center">
                ไม่พบข้อมูล
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomeTableA110F;
