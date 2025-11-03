import { getPool } from "../config/db.js";
import sql from "mssql";

export const getProduction = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query || {};
        const pool = await getPool();
        const request = pool.request();

        let query = "SELECT * FROM FM_production_record";
        if (dateFrom && dateTo) {
            query += " WHERE CAST(create_date AS DATE) BETWEEN @dateFrom AND @dateTo";
            request.input("dateFrom", sql.Date, dateFrom);
            request.input("dateTo", sql.Date, dateTo);
        }
        query += " ORDER BY create_date DESC";

        const result = await request.query(query);
        
        // Format ข้อมูลใน server
        const formattedData = result.recordset.map(row => {
            // Format วันที่และเวลา
            const formatDateTime = (dateTime) => {
                if (!dateTime) return "-";
                try {
                    const date = new Date(dateTime);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
                } catch (error) {
                    return "-";
                }
            };

            const formatDate = (date) => {
                if (!date) return "-";
                try {
                    const d = new Date(date);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`; // <-- เปลี่ยนตรงนี้
                } catch (error) {
                    return "-";
                }
            };

            // คำนวณสถานะการผลิต
            const getProductionStatus = (startTime, endTime) => {
                if (!startTime) {
                    return { label: "ไม่มีข้อมูล", color: "default", icon: "❓" };
                }

                const now = new Date();
                const start = new Date(startTime);
                const end = endTime ? new Date(endTime) : null;

                if (now < start) {
                    return { label: "รอผลิต", color: "warning", icon: "⏳" };
                } else if (!end || now <= end) {
                    return { label: "กำลังผลิต", color: "primary", icon: "🔄" };
                } else {
                    return { label: "สิ้นสุดการผลิต", color: "success", icon: "✅" };
                }
            };

            return {
                ...row,
                formatted_create_date: formatDate(row.create_date),
                formatted_start_time: formatDateTime(row.start_time),
                formatted_end_time: formatDateTime(row.end_time),
                production_status: getProductionStatus(row.start_time, row.end_time)
            };
        });

        return res.status(200).json(formattedData);
    } catch (error) {
        console.error("Error fetching production data:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
};

export const getRunRecord = async (req, res) => {
    const { productionId } = req.params;
    if (!productionId) {
        return res.status(400).json({ message: "Missing productionId parameter." });
    }
    try {
        const pool = await getPool();
        const request = pool.request();
        const query = `
            SELECT 
                id, run_no, record_date, program_no, product_name, operator_name
            FROM FM_run_record
            WHERE production_record_id = @productionId
            ORDER BY id ASC
        `;
        request.input('productionId', sql.Int, productionId);
        const result = await request.query(query);
        return res.status(200).json(result.recordset || []);
    } catch (error) {
        console.error("❌ Error in fetching run details:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getRunRecordData = async (req, res) => {
    const { recordId } = req.params;
    if (!recordId) {
        return res.status(400).json({ message: "Missing recordId parameter." });
    }

    const query = `
        SELECT 
        	-- Prodcution Record Table
            FMPR.id AS FMPR_id, FMPR.product_name AS FMPR_productName,

        	-- Run Record Table
        	FMBR.id as FMBR_id,
            FMBR.run_no as FMBR_runNo, FMBR.record_date as FMBR_recDate, FMBR.product_status as FMBR_productStatus,
            FMBR.program_no as FMBR_programNo, FMBR.emp_shift as FMBR_shift, FMBR.operator_name as FMBR_operator,

        	-- Chemical Name Table
        	FMCN.chemical_name_1 AS FMCN_chemicalName_1, FMCN.chemical_name_2 AS FMCN_chemicalName_2, FMCN.chemical_name_3 AS FMCN_chemicalName_3, FMCN.chemical_name_4 AS FMCN_chemicalName_4, FMCN.chemical_name_5 AS FMCN_chemicalName_5,
        	FMCN.chemical_name_6 AS FMCN_chemicalName_6, FMCN.chemical_name_7 AS FMCN_chemicalName_7, FMCN.chemical_name_8 AS FMCN_chemicalName_8, FMCN.chemical_name_9 AS FMCN_chemicalName_9, FMCN.chemical_name_10 AS FMCN_chemicalName_10,
        	FMCN.chemical_name_11 AS FMCN_chemicalName_11, FMCN.chemical_name_12 AS FMCN_chemicalName_12, FMCN.chemical_name_13 AS FMCN_chemicalName_13, FMCN.chemical_name_14 AS FMCN_chemicalName_14, FMCN.chemical_name_15 AS FMCN_chemicalName_15,

            -- Chemical Weight Table
	        FMCW.chemical_weight_1 AS FMCW_chemicalWeight_1, FMCW.chemical_weight_2 AS FMCW_chemicalWeight_2, FMCW.chemical_weight_3 AS FMCW_chemicalWeight_3, FMCW.chemical_weight_4 AS FMCW_chemicalWeight_4, FMCW.chemical_weight_5 AS FMCW_chemicalWeight_5,
	        FMCW.chemical_weight_6 AS FMCW_chemicalWeight_6, FMCW.chemical_weight_7 AS FMCW_chemicalWeight_7, FMCW.chemical_weight_8 AS FMCW_chemicalWeight_8, FMCW.chemical_weight_9 AS FMCW_chemicalWeight_9, FMCW.chemical_weight_10 AS FMCW_chemicalWeight_10,
	        FMCW.chemical_weight_11 AS FMCW_chemicalWeight_11, FMCW.chemical_weight_12 AS FMCW_chemicalWeight_12, FMCW.chemical_weight_13 AS FMCW_chemicalWeight_13, FMCW.chemical_weight_14 AS FMCW_chemicalWeight_14, FMCW.chemical_weight_15 AS FMCW_chemicalWeight_15,

            -- Mix Table
            FMMX.hopper_weight AS FMMX_hopperWeight, FMMX.actual_start AS FMMX_actualStart, FMMX.mix_finish AS FMMX_mixFinish,FMMX.lip AS FMMX_lip,
            FMMX.casing_a AS FMMX_casingA, FMMX.casing_b AS FMMX_casingB, FMMX.temp_hopper AS FMMX_tempHopper, FMMX.long_screw AS FMMX_longScrew, FMMX.short_screw AS FMMX_shortScrew, FMMX.water_heat AS FMMX_waterHeat,
            FMMX.program_hopper AS FMMX_programHopper, FMMX.program_kneader AS FMMX_programKneader, FMMX.program_extruder AS FMMX_programExtruder,

            -- Cut Table
            FMCU.weight_block_1 AS FMCU_weightBlock_1, FMCU.weight_block_2 AS FMCU_weightBlock_2, FMCU.weight_block_3 AS FMCU_weightBlock_3, FMCU.weight_block_4 AS FMCU_weightBlock_4, FMCU.weight_block_5 AS FMCU_weightBlock_5,
            FMCU.weight_block_6 AS FMCU_weightBlock_6, FMCU.weight_block_7 AS FMCU_weightBlock_7, FMCU.weight_block_8 AS FMCU_weightBlock_8, FMCU.weight_block_9 AS FMCU_weightBlock_9, FMCU.weight_block_remain AS FMCU_weightBlockRemain,

            -- Pre Press Table
            FMPP.temp_pre_press AS FMPP_tempPrePress, FMPP.water_heat_1 AS FMPP_waterHeat_1, FMPP.water_heat_2 AS FMPP_waterHeat_2, FMPP.bake_time_pre_press AS FMPP_bakeTimePrePress,

            -- Primary Press Table
            FMPMP.program_no AS FMPMP_programNo, FMPMP.top_temp AS FMPMP_topTemp, FMPMP.temp_block_1 AS FMPMP_tempBlock_1, FMPMP.temp_block_2 AS FMPMP_tempBlock_2, FMPMP.temp_block_3 AS FMPMP_tempBlock_3,
            FMPMP.temp_block_4 AS FMPMP_tempBlock_4, FMPMP.temp_block_5 AS FMPMP_tempBlock_5, FMPMP.temp_block_6 AS FMPMP_tempBlock_6, FMPMP.emp_spray AS FMPMP_empSpray, FMPMP.bake_time_primary AS FMPMP_bakeTimePrimary,

            -- Secondary Press Table
            FMSP.machine_no AS FMSP_machineNo, FMSP.program_no AS FMSP_programNo, FMSP.steam_in_press AS FMSP_steamInPress, FMSP.width_foam AS FMSP_widthFoam, FMSP.length_foam AS FMSP_lengthFoam,
            FMSP.bake_secondary_time AS FMSP_bakeSecondaryTime, FMSP.inject_emp AS FMSP_injectEmp, FMSP.temp_check_1 AS FMSP_tempCheck_1, FMSP.temp_check_2 AS FMSP_tempCheck_2, FMSP.temp_out AS FMSP_tempOut,

            -- Foam Check Table
            FMFC.run_no AS FMFC_runNo, FMFC.foam_block_1 AS FMFC_foamBlock_1, FMFC.foam_block_2 AS FMFC_foamBlock_2, FMFC.foam_block_3 AS FMFC_foamBlock_3, FMFC.foam_block_4 AS FMFC_foamBlock_4,
            FMFC.foam_block_5 AS FMFC_foamBlock_5, FMFC.foam_block_6 AS FMFC_foamBlock_6, FMFC.employee_record AS FMFC_employeeRecord,  FMFC.exit_secondary_press AS FMFC_exitSecondaryPress

            FROM FM_production_record FMPR
            LEFT JOIN FM_run_record AS FMBR ON FMPR.id = FMBR.production_record_id
        	LEFT JOIN FM_chemical_name_step AS FMCN ON FMBR.id = FMCN.run_record_id
            LEFT JOIN FM_chemical_weight_step AS FMCW ON FMBR.id = FMCW.run_record_id
            LEFT JOIN FM_mixing_step AS FMMX ON FMBR.id = FMMX.run_record_id
            LEFT JOIN FM_cut_step AS FMCU ON FMBR.id = FMCU.run_record_id
            LEFT JOIN FM_pre_press_step AS FMPP ON FMBR.id = FMPP.run_record_id
            LEFT JOIN FM_primary_press_step AS FMPMP ON FMBR.id = FMPMP.run_record_id
            LEFT JOIN FM_secondary_press_step AS FMSP ON FMBR.id = FMSP.run_record_id
            LEFT JOIN FM_foam_check_step AS FMFC ON FMBR.id = FMFC.run_record_id
        WHERE FMBR.id = @recordId
    `;
    
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('recordId', sql.Int, recordId);
        const result = await request.query(query);

        const formatted = (result.recordset || []).map(row => {
            const formattedRow = {};
            Object.keys(row).forEach(key => {
                if (key === 'FMBR_recDate' && row[key]) {
                    const d = new Date(row[key]);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    formattedRow[key] = `${year}-${month}-${day}`;
                } else {
                    formattedRow[key] = row[key] || "";
                }
            });
            return formattedRow;
        });

        return res.status(200).json(formatted);
    } catch (error) {
        console.error("❌ Error in fetching record data:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getRunStatus = async (req, res) => {
    const { productionId } = req.params;
    if (!productionId) {
        return res.status(400).json({ message: "Missing productionId parameter." });
    }

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('productionId', sql.Int, productionId);

        const query = `
            SELECT 
                FMBR.id as FMBR_id,
                FMBR.run_no as FMBR_runNo,
                FMCN.id AS FMCN_Id,
                FMCW.id AS FMCW_Id,
                FMMX.id AS FMMX_Id,
                FMCU.id AS FMCU_Id,
                FMPP.id AS FMPP_Id,
                FMPMP.id AS FMPMP_Id,
                FMSP.id AS FMSP_Id,
                FMFC.id AS FMFC_id
            FROM FM_run_record FMBR
            LEFT JOIN FM_chemical_name_step AS FMCN ON FMBR.id = FMCN.run_record_id
            LEFT JOIN FM_chemical_weight_step AS FMCW ON FMBR.id = FMCW.run_record_id
            LEFT JOIN FM_mixing_step AS FMMX ON FMBR.id = FMMX.run_record_id
            LEFT JOIN FM_cut_step AS FMCU ON FMBR.id = FMCU.run_record_id
            LEFT JOIN FM_pre_press_step AS FMPP ON FMBR.id = FMPP.run_record_id
            LEFT JOIN FM_primary_press_step AS FMPMP ON FMBR.id = FMPMP.run_record_id
            LEFT JOIN FM_secondary_press_step AS FMSP ON FMBR.id = FMSP.run_record_id
            LEFT JOIN FM_foam_check_step AS FMFC ON FMBR.id = FMFC.run_record_id
            WHERE FMBR.production_record_id = @productionId
        `;

        const result = await request.query(query);
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "No run records found for this production." });
        }

        const totalSteps = 8;
        const statusList = result.recordset.map(row => {
            const stepIds = [
                row.FMCN_Id,
                row.FMCW_Id,
                row.FMMX_Id,
                row.FMCU_Id,
                row.FMPP_Id,
                row.FMPMP_Id,
                row.FMSP_Id,
                row.FMFC_id
            ];
            const completedSteps = stepIds.filter(id => id !== null).length;
            const allNull = completedSteps === 0;
            const allNotNull = completedSteps === totalSteps;
            
            let status = "ยังไม่เริ่มผลิต";
            let statusDisplay = { label: "ยังไม่เริ่ม", color: "default", icon: "⭕" };
            
            if (allNotNull) {
                status = "บันทึกครบแล้ว";
                statusDisplay = { label: "บันทึกครบแล้ว", color: "success", icon: "✅" };
            } else if (!allNull) {
                status = `กำลังผลิต ${completedSteps}/${totalSteps}`;
                statusDisplay = {
                    label: `กำลังบันทึก ${completedSteps}/${totalSteps}`,
                    color: "warning",
                    icon: "⚠️"
                };
            }

            return {
                runId: row.FMBR_id,
                runNo: row.FMBR_runNo,
                status,
                statusDisplay,
                completedSteps,
                totalSteps,
                isCompleteData: allNotNull,
                hasSignificantData: completedSteps >= 3
            };
        });

        return res.status(200).json(statusList);
    }
    catch (error) {
        console.error("❌ Error in fetching run status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const upFirstStep = async (req, res) => {
    const { recordDate, productStatus, programNo, shiftTime, operatorName } = req.body;
    const { recordId } = req.params;
    if (!recordId) {
        return res.status(400).json({ message: "Missing recordId parameter." });
    }
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('recordDate', sql.Date, recordDate);
        request.input('productStatus', sql.NVarChar, productStatus);
        request.input('programNo', sql.NVarChar, programNo);
        request.input('shiftTime', sql.NVarChar, shiftTime);
        request.input('operatorName', sql.NVarChar, operatorName);
        request.input('recordId', sql.Int, recordId);

        const query = `
            UPDATE FM_run_record
            SET 
                record_date = @recordDate,
                product_status = @productStatus,
                program_no = @programNo,
                emp_shift = @shiftTime,
                operator_name = @operatorName
            WHERE id = @recordId;
        `;

        await request.query(query);
        return res.status(200).json({ message: "First step updated successfully." });
    } catch (error) {
        console.error("❌ Error in updating first step:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};