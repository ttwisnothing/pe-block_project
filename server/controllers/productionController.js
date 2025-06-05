import { getPool } from "../config/db.js";
import sql from "mssql";

export const getProduction = async (req, res) => {
    try {
        // เปลี่ยนจาก req.body เป็น req.query สำหรับ GET request
        const { dateFrom, dateTo } = req.query || {};
        const pool = await getPool();
        const request = pool.request();

        let query = "SELECT * FROM FM_production_record";

        if (dateFrom && dateTo) {
            query += " WHERE CAST(create_date AS DATE) BETWEEN @dateFrom AND @dateTo";
            request.input("dateFrom", sql.Date, dateFrom);
            request.input("dateTo", sql.Date, dateTo);
        }

        // เพิ่ม ORDER BY เพื่อเรียงลำดับ
        query += " ORDER BY create_date DESC";

        const result = await request.query(query);
        res.status(200).json(result.recordset);

    } catch (error) {
        console.error("Error fetching production data:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
};

export const getBatchRecord = async (req, res) => {
    const { productionId } = req.params;

    try {
        const pool = await getPool();
        
        const query = `
            SELECT 
                id, batch_no, record_date, program_no, product_name, operator_name
            FROM FM_batch_record
            WHERE production_record_id = @productionId
            ORDER BY batch_no ASC
        `;
        
        const request = pool.request();
        request.input('productionId', sql.Int, productionId);
        const result = await request.query(query);
        const record = result.recordset || [];
        
        // ส่ง array โดยตรง แทนที่จะ wrap ใน object
        return res.status(200).json(record);
         
    } catch (error) {
        console.error("❌ Error in fetching batch details: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getBatchRecordData = async (req, res) => {
    const { recordId } = req.params;

    const query = `
        SELECT 
        	-- Prodcution Record Table
            FMPR.id AS FMPR_id, FMPR.product_name AS FMPR_productName,

        	-- Batch Record Table
        	FMBR.id as FMBR_id,
            FMBR.batch_no as FMBR_batchNo, FMBR.record_date as FMBR_recDate, FMBR.product_status as FMBR_productStatus,
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
            FMMX.program_no AS FMMX_programNo, FMMX.hopper_weight AS FMMX_hopperWeight, FMMX.actual_start AS FMMX_actualStart, FMMX.mix_finish AS FMMX_mixFinish,FMMX.lip AS FMMX_lip,
            FMMX.casing_a AS FMMX_cassingA, FMMX.casing_b AS FMMX_cassingB, FMMX.temp_hopper AS FMMX_tempHopper, FMMX.long_screw AS FMMX_longScrew, FMMX.short_screw AS FMMX_shortScrew, FMMX.water_heat AS FMMX_waterHeat

            FROM FM_production_record FMPR
            LEFT JOIN FM_batch_record AS FMBR ON FMPR.id = FMBR.production_record_id
        	LEFT JOIN FM_chemical_name_step AS FMCN ON FMBR.id = FMCN.batch_record_id
            LEFT JOIN FM_chemical_weight_step AS FMCW ON FMBR.id = FMCW.batch_record_id
            LEFT JOIN FM_mixing_step AS FMMX ON FMBR.id = FMMX.batch_record_id
        WHERE FMBR.id = @recordId
    `;

    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('recordId', sql.Int, recordId);

        const result = await request.query(query);

        // Format ข้อมูลแบบครบถ้วน - ส่งทุกฟิลด์รวม null
        const formatted = (result.recordset || []).map(row => {
            const formattedRow = {};
            
            Object.keys(row).forEach(key => {
                if (key === 'FMBR_recDate' && row[key]) {
                    const d = new Date(row[key]);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    formattedRow[key] = `${day}/${month}/${year}`;
                } else {
                    // ส่งทุกฟิลด์ แม้ที่เป็น null (จะแปลงเป็น "" สำหรับ frontend)
                    formattedRow[key] = row[key] || "";
                }
            });

            return formattedRow;
        });

        return res.status(200).json(formatted);
    } catch (error) {
        console.error("❌ Error in fetching record data: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const upFirstStep = async (req, res) => {
    const { recordDate, productStatus, programNo, shiftTime, operatorName } = req.body;
    const { recordId } = req.params;

    try {
        const pool = await getPool();
        const request = pool.request();

        // Update the first step with the provided data
        const query = `
            UPDATE FM_batch_record
            SET record_date = @recordDate,
                product_status = @productStatus,
                program_no = @programNo,
                emp_shift = @shiftTime,
                operator_name = @operatorName
            WHERE id = @recordId;
        `;

        request.input('recordDate', sql.Date, recordDate);
        request.input('productStatus', sql.NVarChar, productStatus);
        request.input('programNo', sql.NVarChar, programNo);
        request.input('shiftTime', sql.NVarChar, shiftTime);
        request.input('operatorName', sql.NVarChar, operatorName);
        request.input('recordId', sql.Int, recordId);

        await request.query(query);

        res.status(200).json({ message: "First step updated successfully." });
    } catch (error) {
        console.error("❌ Error in updating first step: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
}