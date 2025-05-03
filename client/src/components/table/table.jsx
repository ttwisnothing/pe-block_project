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
  return (
    <TableContainer component={Paper} className="custom-table-container">
      <Table className="custom-table">
        <TableHead>
          <TableRow>
            <TableCell>Run No</TableCell>
            <TableCell>Machine</TableCell>
            <TableCell>Batch No</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>Mixing</TableCell>
            <TableCell>Extruder Exit</TableCell>
            <TableCell>Pre-Press Exit</TableCell>
            <TableCell>Primary Press Start</TableCell>
            <TableCell>Stream In</TableCell>
            <TableCell>Primary Press Exit</TableCell>
            <TableCell className="secondary-press">Secondary Press 1</TableCell>
            <TableCell className="temp-check">Temp Check 1</TableCell>
            <TableCell className="secondary-press">Secondary Press 2</TableCell>
            <TableCell className="temp-check">Temp Check 2</TableCell>
            <TableCell>Cooling</TableCell>
            <TableCell>Secondary Press Exit</TableCell>
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
