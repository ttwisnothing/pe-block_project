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

const CustomTable = ({ data , formatTime }) => {
  // กรองข้อมูล: ลบแถวที่ solidBlock ไม่มีค่า
  const filteredData = data.filter((plan) => plan.solidBlock !== null && plan.solidBlock !== undefined);

  // ตรวจสอบว่ามีข้อมูล solidBlock หรือไม่
  const hasSolidBlock = filteredData.some((plan) => plan.solidBlock !== null && plan.solidBlock !== undefined);

  return (
    <TableContainer component={Paper} className="custom-table-container">
      <Table className="custom-table">
        <TableHead>
          <TableRow>
            <TableCell>Run No</TableCell>
            <TableCell>เครื่อง</TableCell>
            <TableCell>Batch No</TableCell>
            <TableCell>เริ่มเดินงาน</TableCell>
            <TableCell>เวลาผสมเสร็จ</TableCell>
            {hasSolidBlock && <TableCell>SolidBlock</TableCell>}
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
            {hasSolidBlock && <TableCell>เอางานออก</TableCell>}
            <TableCell>Block</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((plan, index) => {
            const isFirstRowForRun =
              index === 0 || plan.run_no !== data[index - 1].run_no;

            return (
              <React.Fragment key={index}>
                {index === data.length - 1 && (
                  <TableRow>
                    <TableCell colSpan={17} className="adj-stop-row">
                      กด ADJ STOP
                    </TableCell>
                  </TableRow>
                )}

                <TableRow>
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {plan.run_no}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {plan.machine}
                    </TableCell>
                  )}
                  <TableCell>{plan.batch_no}</TableCell>
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
                  {hasSolidBlock && (
                    <TableCell className={!plan.solidBlock ? "missing-time" : ""}>
                      {plan.solidBlock || ""}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.pre_press_exit)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.primary_press_start)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                      className="stream-in"
                    >
                      {formatTime(plan.stream_in)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.primary_press_exit)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                      className="secondary-press-start"
                    >
                      {formatTime(plan.secondary_press_1_start)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                      className="temp-check-row"
                    >
                      {formatTime(plan.temp_check_1)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                      className="secondary-press-start"
                    >
                      {formatTime(plan.secondary_press_2_start)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                      className="temp-check-row"
                    >
                      {formatTime(plan.temp_check_2)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.cooling)}
                    </TableCell>
                  )}
                  {isFirstRowForRun && (
                    <TableCell
                      rowSpan={
                        data.filter((p) => p.run_no === plan.run_no).length
                      }
                    >
                      {formatTime(plan.secondary_press_exit)}
                    </TableCell>
                  )}
                  {hasSolidBlock && (
                    <TableCell className={!plan.solidBlock ? "missing-time" : ""}>
                      {plan.solidBlock || ""}
                    </TableCell>
                  )}
                  <TableCell>{plan.block}</TableCell>
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
