import { getPool } from "../config/db.js";
import sql from "mssql";
import { format, intervalToDuration, formatDuration } from 'date-fns';

function minToHHmm(mins) {
    if (isNaN(mins) || mins < 0) return "-";
    const duration = intervalToDuration({ start: 0, end: mins * 60 * 1000 });
    const formatted = formatDuration(duration, { format: ['hours', 'minutes'], zero: true, delimiter: ' ' })
        .replace(' hours', ' h')
        .replace(' hour', ' h')
        .replace(' minutes', ' min')
        .replace(' minute', ' min');
    return formatted;
}

export const AvailabilityQuery = async (req, res) => {
    const { plantimeId } = req.query;

    const query = `
        SELECT 
            FMPR.id AS FMPR_Id, FMPR.plantime_id AS PMPR_planId, FMPR.product_name AS FMPR_proName,
            FMPR.start_time AS FMPR_startTime, FMPR.end_time AS FMPR_endTime, FMPR.total_block AS FMPR_totalBlock,
            FMRR.id AS FMRR_Id,
            FMFC.id AS FMFC_Id, FMFC.run_record_id AS FMFC_runId, FMFC.run_no AS FMFC_runNo,
            FMFC.exit_secondary_press AS FMFC_exitSecondaryPress, PTPT.secondary_press_exit AS PTPT_secondaryPressExit
        FROM FM_production_record AS FMPR
        LEFT JOIN FM_run_record AS FMRR ON FMRR.production_record_id = FMPR.id
        LEFT JOIN FM_foam_check_step AS FMFC ON FMRR.id = FMFC.run_record_id
        LEFT JOIN PT_plan_time_mst AS PTPT ON FMRR.id = PTPT.run_no
        WHERE PTPT.plantime_id = @plantime_id AND FMFC.exit_secondary_press IS NOT NULL
        ORDER BY FMRR.id DESC
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("plantime_id", sql.VarChar, plantimeId);

        const result = await request.query(query);

        const row = result.recordset[0];

        const startTime = row.FMPR_startTime;
        const endTime = row.FMPR_endTime;
        const runTime = row.FMFC_exitSecondaryPress;
        const planExit = row.PTPT_secondaryPressExit;

        let PlanProductTime = 0;
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            PlanProductTime = (end - start) / (1000 * 60);
        }

        let RunTime = 0;
        if (startTime && runTime) {
            const datePart = startTime.split(' ')[0];
            const exitDateTimeStr = `${datePart} ${runTime}`;
            const start = new Date(startTime);
            const exit = new Date(exitDateTimeStr);
            RunTime = (exit - start) / (1000 * 60);
        }

        // === เปรียบเทียบเวลาจริงกับเวลาตามแผนเพื่อหา downtime ===
        let Downtime = 0;
        if (startTime && runTime && planExit) {
            const datePart = startTime.split(' ')[0];
            const actualExit = new Date(`${datePart} ${runTime}`);
            const planExitDate = new Date(`${datePart} ${planExit}`);
            Downtime = (actualExit - planExitDate) / (1000 * 60);
            if (Downtime < 0) Downtime = 0;
        }

        const AvailableTime = PlanProductTime - Downtime;
        const Availability = PlanProductTime ? (AvailableTime / PlanProductTime) * 100 : 0;

        const data = {
            PlanTime_ID: row.PMPR_planId,
            ProductName: row.FMPR_proName,
            StartTime: startTime,
            EndTime: endTime,
            TotalBlock: row.FMPR_totalBlock,
            PlannedProductionTime: minToHHmm(PlanProductTime),
            RunTime: minToHHmm(RunTime),
            Downtime: minToHHmm(Downtime),
            Availability: Availability,
        }

        res.json(data);
    } catch (error) {
        console.error("Error fetching availability data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const PerformanceQuery = async (req, res) => {
    const { plantimeId } = req.query;

    const query = `
        ;WITH Foam AS (
            SELECT
                FMPR.id               AS FMPR_Id,
                FMPR.plantime_id      AS PMPR_planId,
                FMPR.product_name     AS FMPR_proName,
                FMPR.start_time       AS FMPR_startTime,
                FMPR.end_time         AS FMPR_endTime,
                FMPR.total_block      AS FMPR_totalBlock,
                FMRR.id               AS FMRR_Id,
                FMFC.id               AS FMFC_Id,
                FMFC.run_record_id    AS FMFC_runId,
                FMFC.run_no           AS FMFC_runNo,
                FMFC.exit_secondary_press AS FMFC_exitSecondaryPress,
                UPPER(LTRIM(RTRIM(v.status))) AS foam_status
            FROM FM_production_record AS FMPR
            LEFT JOIN FM_run_record       AS FMRR ON FMRR.production_record_id = FMPR.id
            LEFT JOIN FM_foam_check_step  AS FMFC ON FMRR.id = FMFC.run_record_id
            CROSS APPLY (VALUES
                (FMFC.foam_block_1),
                (FMFC.foam_block_2),
                (FMFC.foam_block_3),
                (FMFC.foam_block_4),
                (FMFC.foam_block_5),
                (FMFC.foam_block_6)
            ) v(status)
            WHERE FMPR.plantime_id = @plantime_id AND FMFC.exit_secondary_press IS NOT NULL
        )
        SELECT
            FMPR_Id,
            PMPR_planId,
            FMPR_proName,

            FMPR_startTime,
            FMPR_endTime,

            FMPR_totalBlock,
            FMRR_Id,
            FMFC_Id,
            FMFC_runId,
            FMFC_runNo,
            MAX(FMFC_exitSecondaryPress) AS FMFC_exitSecondaryPress,

            SUM(CASE WHEN foam_status = 'OK' THEN 1 ELSE 0 END)                       AS cnt_OK,
            SUM(CASE WHEN foam_status = 'NG' THEN 1 ELSE 0 END)                       AS cnt_NG,
            SUM(CASE WHEN foam_status = 'RW' THEN 1 ELSE 0 END)                       AS cnt_RW,
            SUM(CASE WHEN foam_status IN ('OK','NG') THEN 1 ELSE 0 END)               AS cnt_Complete,
            SUM(CASE WHEN foam_status IN ('REWORK','RE-WORK','RW') THEN 1 ELSE 0 END) AS cnt_NonComplete
        FROM Foam
        GROUP BY
            FMPR_Id, PMPR_planId, FMPR_proName,
            FMPR_startTime, FMPR_endTime, FMPR_totalBlock,
            FMRR_Id, FMFC_Id, FMFC_runId, FMFC_runNo
        ORDER BY FMRR_Id DESC;
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("plantime_id", sql.VarChar, plantimeId);

        const result = await request.query(query);
        const totalCount = result.recordset.reduce((sum, row) => sum + (row.cnt_Complete || 0), 0);
        const row = result.recordset[0];

        const startTime = row.FMPR_startTime;
        const endTime = row.FMPR_endTime;
        const runTime = row.FMFC_exitSecondaryPress;
        const totalBlock = row.FMPR_totalBlock || 0;

        let PlanProductTime = 0;
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            PlanProductTime = (end - start) / (1000 * 60);
        }

        let ICT = 0;
        if (totalBlock && PlanProductTime) {
            ICT = PlanProductTime / totalBlock;
        }

        let RunTime = 0;
        if (startTime && runTime) {
            // ดึงวันที่จาก startTime
            const datePart = startTime.split(' ')[0];
            // รวมกับ runTime
            const exitDateTimeStr = `${datePart} ${runTime}`;
            const start = new Date(startTime);
            const exit = new Date(exitDateTimeStr);
            RunTime = (exit - start) / (1000 * 60);
        }

        const Performance = (ICT && RunTime) ? (ICT * totalCount / RunTime) * 100 : 0;

        const data = {
            PlanTime_ID: row.PMPR_planId,
            ProductName: row.FMPR_proName,
            StartTime: startTime,
            EndTime: endTime,
            TotalBlock: row.FMPR_totalBlock,
            IdealCycleTime: ICT,
            TotalCount: totalCount,
            RunTime: RunTime.toFixed(2),
            Performance: Performance.toFixed(2),
        }

        res.json(data);
    } catch (error) {
        console.error("Error fetching performance data:", error);
        res.status(500).json({ error: "Internal server error" });
    }

};

export const QualityQuery = async (req, res) => {
    const { plantimeId } = req.query;

    const query = `
        ;WITH Foam AS (
            SELECT
                FMPR.id               AS FMPR_Id,
                FMPR.plantime_id      AS PMPR_planId,
                FMPR.product_name     AS FMPR_proName,
                FMPR.start_time       AS FMPR_startTime,
                FMPR.end_time         AS FMPR_endTime,
                FMPR.total_block      AS FMPR_totalBlock,
                FMRR.id               AS FMRR_Id,
                FMFC.id               AS FMFC_Id,
                FMFC.run_record_id    AS FMFC_runId,
                FMFC.run_no           AS FMFC_runNo,
                FMFC.exit_secondary_press AS FMFC_exitSecondaryPress,
                UPPER(LTRIM(RTRIM(v.status))) AS foam_status
            FROM FM_production_record AS FMPR
            LEFT JOIN FM_run_record       AS FMRR ON FMRR.production_record_id = FMPR.id
            LEFT JOIN FM_foam_check_step  AS FMFC ON FMRR.id = FMFC.run_record_id
            CROSS APPLY (VALUES
                (FMFC.foam_block_1),
                (FMFC.foam_block_2),
                (FMFC.foam_block_3),
                (FMFC.foam_block_4),
                (FMFC.foam_block_5),
                (FMFC.foam_block_6)
            ) v(status)
            WHERE FMPR.plantime_id = @plantime_id AND FMFC.exit_secondary_press IS NOT NULL
        )
        SELECT
            FMPR_Id,
            PMPR_planId,
            FMPR_proName,
    
            FMPR_startTime,
            FMPR_endTime,
    
            FMPR_totalBlock,
            FMRR_Id,
            FMFC_Id,
            FMFC_runId,
            FMFC_runNo,
            MAX(FMFC_exitSecondaryPress) AS FMFC_exitSecondaryPress,
    
            SUM(CASE WHEN foam_status = 'OK' THEN 1 ELSE 0 END)                       AS cnt_OK,
            SUM(CASE WHEN foam_status = 'NG' THEN 1 ELSE 0 END)                       AS cnt_NG,
            SUM(CASE WHEN foam_status = 'RW' THEN 1 ELSE 0 END)                       AS cnt_RW,
            SUM(CASE WHEN foam_status IN ('OK','NG') THEN 1 ELSE 0 END)               AS cnt_Complete,
            SUM(CASE WHEN foam_status IN ('REWORK','RE-WORK','RW') THEN 1 ELSE 0 END) AS cnt_NonComplete
        FROM Foam
        GROUP BY
            FMPR_Id, PMPR_planId, FMPR_proName,
            FMPR_startTime, FMPR_endTime, FMPR_totalBlock,
            FMRR_Id, FMFC_Id, FMFC_runId, FMFC_runNo
        ORDER BY FMRR_Id DESC;
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("plantime_id", sql.VarChar, plantimeId);

        const result = await request.query(query);
        const row = result.recordset[0];

        const okCount = result.recordset.reduce((sum, row) => sum + (row.cnt_OK || 0), 0);
        const ngCount = result.recordset.reduce((sum, row) => sum + (row.cnt_NG || 0), 0);
        const rwCount = result.recordset.reduce((sum, row) => sum + (row.cnt_RW || 0), 0);

        const totalCount = result.recordset.reduce((sum, row) => sum + (row.cnt_Complete || 0), 0)

        const Quality = totalCount ? (okCount / totalCount) * 100 : 0;

        const data = {
            PlanTime_ID: row.PMPR_planId,
            ProductName: row.FMPR_proName,
            StartTime: row.FMPR_startTime,
            EndTime: row.FMPR_endTime,
            TotalBlock: row.FMPR_totalBlock,
            GoodCount: okCount,
            NonGoodCount: ngCount,
            ReworkCount: rwCount,
            TotalCount: totalCount,
            Quality: Quality.toFixed(2),
        }

        res.json(data);
    } catch (error) {
        console.error("Error fetching quality data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const OEEQuery = async (req, res) => {
    const { plantimeId } = req.query;

    const query = `
            ;WITH Foam AS (
                SELECT
                    FMPR.id               AS FMPR_Id,
                    FMPR.plantime_id      AS PMPR_planId,
                    FMPR.product_name     AS FMPR_proName,
                    FMPR.start_time       AS FMPR_startTime,
                    FMPR.end_time         AS FMPR_endTime,
                    FMPR.total_block      AS FMPR_totalBlock,
                    FMRR.id               AS FMRR_Id,
                    FMFC.id               AS FMFC_Id,
                    FMFC.run_record_id    AS FMFC_runId,
                    FMFC.run_no           AS FMFC_runNo,
                    FMFC.exit_secondary_press AS FMFC_exitSecondaryPress,
                    UPPER(LTRIM(RTRIM(v.status))) AS foam_status
                FROM FM_production_record AS FMPR
                LEFT JOIN FM_run_record AS FMRR        ON FMRR.production_record_id = FMPR.id
                LEFT JOIN FM_foam_check_step AS FMFC   ON FMRR.id = FMFC.run_record_id
                CROSS APPLY (VALUES
                    (FMFC.foam_block_1),
                    (FMFC.foam_block_2),
                    (FMFC.foam_block_3),
                    (FMFC.foam_block_4),
                    (FMFC.foam_block_5),
                    (FMFC.foam_block_6)
                ) v(status)
                WHERE FMPR.plantime_id = @plantime_id
                  AND FMFC.exit_secondary_press IS NOT NULL
            ),
            -- 1) สรุปนับผลต่อกลุ่ม (จบเรื่องนับซ้ำในโครงสร้างของ Foam เอง)
            FoamAgg AS (
                SELECT
                    FMPR_Id, PMPR_planId, FMPR_proName,
                    FMPR_startTime, FMPR_endTime, FMPR_totalBlock,
                    FMRR_Id, FMFC_Id, FMFC_runId, FMFC_runNo,
                    MAX(FMFC_exitSecondaryPress) AS FMFC_exitSecondaryPress,
                    SUM(CASE WHEN foam_status = 'OK' THEN 1 ELSE 0 END) AS cnt_OK,
                    SUM(CASE WHEN foam_status = 'NG' THEN 1 ELSE 0 END) AS cnt_NG,
                    SUM(CASE WHEN foam_status = 'RW' THEN 1 ELSE 0 END) AS cnt_RW,
                    SUM(CASE WHEN foam_status IN ('OK','NG') THEN 1 ELSE 0 END) AS cnt_Complete,
                    SUM(CASE WHEN foam_status IN ('REWORK','RE-WORK','RW') THEN 1 ELSE 0 END) AS cnt_NonComplete
                FROM Foam
                GROUP BY
                    FMPR_Id, PMPR_planId, FMPR_proName,
                    FMPR_startTime, FMPR_endTime, FMPR_totalBlock,
                    FMRR_Id, FMFC_Id, FMFC_runId, FMFC_runNo
            ),
            -- 2) บีบ PTPT ให้เหลือ 1 แถวต่อ run_no ก่อนค่อย join
            PTPTAgg AS (
                SELECT
                    run_no,
                    MAX(secondary_press_exit) AS PTPT_secondaryPressExit
                FROM PT_plan_time_mst
                GROUP BY run_no
            )
            SELECT
                f.*,
                p.PTPT_secondaryPressExit
            FROM FoamAgg f
            LEFT JOIN PTPTAgg p
                ON f.FMFC_runNo = p.run_no
            ORDER BY f.FMRR_Id DESC;
        `;

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input("plantime_id", sql.VarChar, plantimeId);
        const result = await request.query(query);

        const row = result.recordset[0];
        const startTime = row.FMPR_startTime;
        const endTime = row.FMPR_endTime;
        const runTimeStr = row.FMFC_exitSecondaryPress;
        const planExit = row.PTPT_secondaryPressExit;

        // === ใช้สูตรเดียวกับ AvailabilityQuery ===
        let PlanProductTime = 0;
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            PlanProductTime = (end - start) / (1000 * 60);
        }

        let RunTime = 0;
        if (startTime && runTimeStr) {
            const datePart = startTime.split(' ')[0];
            const exitDateTimeStr = `${datePart} ${runTimeStr}`;
            const start = new Date(startTime);
            const exit = new Date(exitDateTimeStr);
            RunTime = (exit - start) / (1000 * 60);
        }

        let Downtime = 0;
        if (startTime && runTimeStr && planExit) {
            const datePart = startTime.split(' ')[0];
            const actualExit = new Date(`${datePart} ${runTimeStr}`);
            const planExitDate = new Date(`${datePart} ${planExit}`);
            Downtime = (actualExit - planExitDate) / (1000 * 60);
            if (Downtime < 0) Downtime = 0;
        }

        const AvailableTime = PlanProductTime - Downtime;
        const Availability = PlanProductTime ? (AvailableTime / PlanProductTime) * 100 : 0;

        // --- Performance ---
        const totalBlock = row.FMPR_totalBlock || 0;
        let ICT = 0;
        if (totalBlock && PlanProductTime) {
            ICT = PlanProductTime / totalBlock;
        }
        const totalCount = result.recordset.reduce((sum, row) => sum + (row.cnt_Complete || 0), 0);
        const Performance = (ICT && RunTime) ? (ICT * totalCount / RunTime) * 100 : 0;

        // --- Quality ---
        const okCount = result.recordset.reduce((sum, row) => sum + (row.cnt_OK || 0), 0);
        const Quality = totalCount ? (okCount / totalCount) * 100 : 0;

        // --- OEE ---
        const OEE = (Availability * Performance * Quality) / 10000;

        const data = {
            PlanTime_ID: row.PMPR_planId,
            ProductName: row.FMPR_proName,
            StartTime: format(new Date(startTime), 'dd-MM-yyyy HH:mm'),
            EndTime: format(new Date(endTime), 'dd-MM-yyyy HH:mm'),
            TotalBlock: totalBlock,
            PlannedProductionTime: PlanProductTime,
            RunTime: RunTime,
            Downtime: Downtime,
            IdealCycleTime: ICT,
            TotalCount: totalCount,
            GoodCount: okCount,
            Availability: Availability.toFixed(2),
            Performance: Performance.toFixed(2),
            Quality: Quality.toFixed(2),
            OEE: OEE.toFixed(2),
        };

        res.json(data);
    } catch (error) {
        console.error("Error fetching OEE data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const MachineQuery = async (req, res) => {
    const { plantimeId } = req.query;

    const query = `
        ;WITH Foam AS (
            SELECT
                FMPR.id               AS FMPR_Id,
                FMPR.plantime_id      AS PMPR_planId,
                FMPR.product_name     AS FMPR_proName,
                FMRR.id               AS FMRR_Id,
                FMFC.run_no           AS FMFC_runNo,
                FMSP.machine_no       AS machine_no,
                UPPER(LTRIM(RTRIM(v.status))) AS foam_status
            FROM FM_production_record AS FMPR
            LEFT JOIN FM_run_record AS FMRR
                ON FMRR.production_record_id = FMPR.id
            LEFT JOIN FM_foam_check_step AS FMFC
                ON FMRR.id = FMFC.run_record_id
            LEFT JOIN FM_secondary_press_step AS FMSP
                ON FMRR.id = FMSP.run_record_id
            CROSS APPLY (VALUES
                (FMFC.foam_block_1),
                (FMFC.foam_block_2),
                (FMFC.foam_block_3),
                (FMFC.foam_block_4),
                (FMFC.foam_block_5),
                (FMFC.foam_block_6)
            ) v(status)
            WHERE FMPR.plantime_id = @plantime_id
              AND FMFC.exit_secondary_press IS NOT NULL
        ),
        FoamAgg AS (
            SELECT
                machine_no,
                FMPR_Id, PMPR_planId, FMPR_proName,
                SUM(CASE WHEN foam_status = 'OK' THEN 1 ELSE 0 END) AS cnt_OK,
                SUM(CASE WHEN foam_status = 'NG' THEN 1 ELSE 0 END) AS cnt_NG,
                SUM(CASE WHEN foam_status = 'RW' THEN 1 ELSE 0 END) AS cnt_RW,
                SUM(CASE WHEN foam_status IN ('OK', 'NG') THEN 1 ELSE 0 END) AS cnt_Complete,
                SUM(CASE WHEN foam_status IN ('REWORK', 'RE-WORK', 'RW') THEN 1 ELSE 0 END) AS cnt_NonComplete
            FROM Foam
            GROUP BY machine_no, FMPR_Id, PMPR_planId, FMPR_proName
        )
        SELECT
            f.machine_no,
            f.cnt_OK,
            f.cnt_NG,
            f.cnt_RW
        FROM FoamAgg f
        ORDER BY f.machine_no;
    `;

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input("plantime_id", sql.VarChar, plantimeId);
        const result = await request.query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching test data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const MachineOEEQuery = async (req, res) => {
    const { plantimeId, machineNo } = req.query;

    const query = `
        ;WITH Foam AS ( 
        	SELECT 
        		FMPR.product_name AS FMPR_ProductName, 
        		FMPR.start_time AS FMPR_StartTime, 
        		FMRR.run_no AS FMRR_RunNo, 
        		FMPR.end_time AS FMPR_EndTime, 
                FMPR.total_block AS FMPR_BlockTotal, 
        		FMSS.machine_no AS FMSS_MachineNo, 
        		FMFC.foam_block_1 AS FMFC_Foam_1, 
        		FMFC.foam_block_2 AS FMFC_Foam_2, 
        		FMFC.foam_block_3 AS FMFC_Foam_3, 
        		FMFC.foam_block_4 AS FMFC_Foam_4, 
        		FMFC.foam_block_5 AS FMFC_Foam_5, 
        		FMFC.foam_block_6 AS FMFC_Foam_6, 
        		FMFC.exit_secondary_press AS FMFC_ActualSecondary, 
        		UPPER(LTRIM(RTRIM(v.status))) AS foam_status 
        	FROM FM_production_record AS FMPR 
        	LEFT JOIN FM_run_record AS FMRR ON FMPR.id = FMRR.production_record_id 
        	LEFT JOIN FM_secondary_press_step AS FMSS ON FMRR.run_no = FMSS.run_record_id 
        	LEFT JOIN FM_foam_check_step AS FMFC ON FMRR.run_no = FMFC.run_record_id 
        	CROSS APPLY (VALUES 
        		(FMFC.foam_block_1), (FMFC.foam_block_2), (FMFC.foam_block_3), 
        		(FMFC.foam_block_4), (FMFC.foam_block_5), (FMFC.foam_block_6) 
        		) 
        	v(status) 
        	WHERE FMPR.plantime_id = @plantime_id 
            AND FMSS.machine_no = @machine_no 
        	AND FMFC.exit_secondary_press IS NOT NULL 
        ), 
        FoamAgg AS ( 
        	SELECT 
        		FMSS_MachineNo, 
        		FMRR_RunNo, 
        		FMPR_ProductName, 
        		FMPR_StartTime, 
        		FMPR_EndTime, 
                FMPR_BlockTotal, 
        		MAX(FMFC_ActualSecondary) AS FMFC_exitSecondaryPress, 
        		SUM(CASE WHEN foam_status = 'OK' THEN 1 ELSE 0 END) AS cnt_OK, 
        		SUM(CASE WHEN foam_status = 'NG' THEN 1 ELSE 0 END) AS cnt_NG, 
        		SUM(CASE WHEN foam_status = 'RW' THEN 1 ELSE 0 END) AS cnt_RW, 
        		SUM(CASE WHEN foam_status IN ('OK','NG') THEN 1 ELSE 0 END) AS cnt_Complete, 
        		SUM(CASE WHEN foam_status IN ('REWORK','RE-WORK','RW') THEN 1 ELSE 0 END) AS cnt_NonComplete 
        	FROM Foam 
        	GROUP BY FMSS_MachineNo, 
        		FMRR_RunNo, FMPR_ProductName, 
        		FMPR_StartTime, FMPR_EndTime, FMPR_BlockTotal
        	), 
        PTPTAgg AS (
            SELECT
                run_no, 
                MAX(secondary_press_exit) AS PTPT_secondaryPressExit
            FROM PT_plan_time_mst
        	WHERE plantime_id = @plantime_id
            GROUP BY run_no
        ), 
        PTMTSum AS ( 
          SELECT COUNT(DISTINCT machine) AS machine_count 
          FROM PT_plan_time_mst 
          WHERE plantime_id = @plantime_id
        ) 
        SELECT
            fa.FMSS_MachineNo      AS machine_no,
            fa.FMRR_RunNo          AS run_no,
            fa.FMPR_ProductName    AS product_name,
            fa.FMPR_StartTime      AS start_time,
            fa.FMPR_EndTime        AS end_time,
            fa.FMPR_BlockTotal	   AS block_total,
            fa.FMFC_exitSecondaryPress AS actual_secondary_press,
            pt.PTPT_secondaryPressExit AS planned_secondary_press,
            fa.cnt_OK, fa.cnt_NG, fa.cnt_RW,
            (fa.cnt_OK + fa.cnt_NG + fa.cnt_RW) AS cnt_total,
            fa.cnt_Complete, fa.cnt_NonComplete, 
        	mts.machine_count 
        FROM FoamAgg fa 
        LEFT JOIN PTPTAgg pt 
          ON pt.run_no = fa.FMRR_RunNo 
        CROSS JOIN PTMTSum mts
        ORDER BY run_no DESC;
    `;

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input("plantime_id", sql.VarChar, plantimeId);
        request.input("machine_no", sql.Int, machineNo);
        const result = await request.query(query);

        const row = result.recordset[0];
        const startTime = row.start_time;
        const runTimeStr = row.actual_secondary_press;
        const planExit = row.planned_secondary_press;
        const machineCount = row.machine_count;

        // === Availability === //
        let PlanProductionTime = 0;
        if (startTime && planExit) {
            const start = new Date(startTime);
            const datePart = startTime.split(' ')[0];
            const endStr = `${datePart} ${planExit}`;
            const end = new Date(endStr.replace(/-/g, '/'));
            PlanProductionTime = (end - start) / (1000 * 60);
        }

        let RunTime = 0;
        if (startTime && runTimeStr) {
            const datePart = startTime.split(' ')[0];
            const exitDateTimeStr = `${datePart} ${runTimeStr}`;
            const start = new Date(startTime);
            const exit = new Date(exitDateTimeStr);
            RunTime = (exit - start) / (1000 * 60);
        }

        let Downtime = 0;
        if (startTime && runTimeStr && planExit) {
            const datePart = startTime.split(' ')[0];
            const actualExit = new Date(`${datePart} ${runTimeStr}`);
            const planExitDate = new Date(`${datePart} ${planExit}`);
            Downtime = (actualExit - planExitDate) / (1000 * 60);
            if (Downtime < 0) Downtime = 0;
        }

        const AvailableTime = PlanProductionTime - Downtime;
        const Availability = PlanProductionTime ? (AvailableTime / PlanProductionTime) * 100 : 0;

        // === Performance === //
        const totalBlock = row.block_total || 0;
        let ICT = 0;
        if (totalBlock && PlanProductionTime) {
            const machineBlock = totalBlock / machineCount;
            ICT = PlanProductionTime / machineBlock;
        }

        const totalCount = result.recordset.reduce((sum, row) => sum + (row.cnt_Complete || 0), 0);
        const totalNg = result.recordset.reduce((sum, row) => sum + (row.cnt_NG || 0), 0);
        const totalRw = result.recordset.reduce((sum, row) => sum + (row.cnt_RW || 0), 0);
        const Performance = (ICT && RunTime) ? (ICT * totalCount / RunTime) * 100 : 0;

        // === Quality === //
        const okCount = result.recordset.reduce((sum, row) => sum + (row.cnt_OK || 0), 0);
        const Quality = totalCount ? (okCount / totalCount) * 100 : 0;

        const OEE = (Availability * Performance * Quality) / 10000;

        res.json({ 
            Availability: Availability.toFixed(2), 
            Performance: Performance.toFixed(2), 
            Quality: Quality.toFixed(2), 
            OEE: OEE.toFixed(2), 
            TotalBlock: totalBlock, 
            okCount: okCount, 
            ngCount: totalNg, 
            rwCount: totalRw,
            planProductionTime: PlanProductionTime,
            runTime: RunTime,
            downTime: Downtime
        });

    } catch (error) {
        console.error("Error fetching test data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const selectPlanId = async (req, res) => {
    try {
        const pool = await getPool();

        const query = `
            SELECT TOP 1 plantime_id, product_name, start_time, end_time
            FROM FM_production_record
            WHERE create_date = (
                SELECT MAX(create_date) FROM FM_production_record
            )
            ORDER BY plantime_id DESC
        `;

        const result = await pool.request().query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching latest plan ID:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const selectDate = async (req, res) => {
    const { sDate } = req.query;

    const query = `
        SELECT plantime_id, product_name, start_time, end_time
        FROM PT_plan_time_mst
        WHERE create_date = @sDate
    `;

    try {
        const pool = await getPool();
        const request = pool.request();

        request.input("sDate", sql.VarChar, sDate);

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching plan IDs:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}